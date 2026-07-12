## 9 · Future Evolution

### 9.1 Evolution A — IPMVP-grounded savings and discounted SIR (analytics ladder: rung 1 → 2)

**What.** EP-DY5 is a functional finance tool — correct level-payment amortisation
over real curated PACE programs and state volumes, effectively no PRNG. §7.6 names
the three genuine gaps: `calcEnergyBenefit` proxies savings as
`cost × pct × rate/0.12` (percentage of *capital cost*, not `kWh saved × $/kWh`);
IPMVP measurement-and-verification is cited but not implemented (savings are assumed
inputs); and cash flow is undiscounted, so the guide's `SIR = NPV(savings)/loan` is
approximated by cumulative net. Evolution A upgrades the energy side to match the
loan side's rigor.

**How.** (1) Engineering savings model: per `IMPROVEMENT_TYPES` measure, savings =
baseline consumption × measure savings fraction × tariff — with baseline kWh either
entered or estimated from building type/area via published CBECS intensity tables
(curated refdata), replacing the capital-cost proxy. (2) Discounting: NPV of the
savings stream at a user discount rate with tariff escalation, making SIR the actual
discounted ratio and adding the NPV summary the workflow promises. (3) IPMVP layer:
an M&V tracking tab — Option C whole-building baseline vs post-retrofit consumption
entry, weather-normalized via degree-days (Open-Meteo historical data is already
integrated) — so "verified savings" becomes a measured comparison, not an
assumption. (4) Scenario toggles (rung 2): tariff paths and rate environments
sweeping the feasibility frontier.

**Prerequisites.** CBECS intensity table curation; degree-day normalization needs
building location. **Acceptance:** the amortisation regression case still
reproduces; SIR computed at 0% discount equals the current cumulative ratio (sanity
link); entering 12 months of post-retrofit consumption produces a weather-normalized
verified-savings figure distinct from the projection.

### 9.2 Evolution B — Origination copilot for C-PACE underwriting (LLM tier 1)

**What.** C-PACE origination is document-and-rule work across state programs with
different consent regimes — exactly what the module's curated data supports.
Evolution B: a copilot that walks a deal through underwriting: "$3M HVAC+solar
retrofit on a $20M Sacramento office with $11M first mortgage" → computes the
combined LTV against the selected program's max, states California's lender-consent
requirement from `STATE_PROGRAMS`, runs the feasibility calc, and drafts the
origination summary — every figure from the page's own `calcPaceLoan` outputs, every
program rule cited to its curated row.

**How.** Tier-1 against page state and the curated datasets (which are real —
PACENation-derived program and state data), plus the Fannie/Freddie consent
guidelines §5 references as corpus texts. The copilot's caveat discipline comes from
§7.6: savings projections are assumptions until M&V data exists (post-Evolution A it
can distinguish projected from verified). No endpoints exist — the calculator is
client-side — so tool-calling waits on a backend, but the deterministic in-page calc
is drivable through page state alone.

**Prerequisites.** Corpus embedding (D3); Evolution A improves brief quality but
tier 1 ships before it with the assumed-savings disclosure. **Acceptance:** the
copilot's LTV and payment figures match the calculator exactly; consent requirements
quoted correctly per state row; infeasible deals (negative net benefit) are stated
as infeasible, not softened.
