## 9 · Future Evolution

### 9.1 Evolution A — Calibrated fNRB with propagated uncertainty (analytics ladder: rung 1 → 3)

**What.** The module's own overview names fNRB as the single largest uncertainty driver
(CV ±15%), and §7 shows `calcCleanCooking` is a real AMS-II.G / Gold Standard
implementation with an explicit `fnrbCalc` engine — but fNRB currently comes from an
in-page heuristic over seeded `COUNTRIES_CC` values. Evolution A replaces this with a
country reference table seeded from the published CDM TOOL30 default values and the
Bailis et al. WISDOM/MoFuSS estimates the reference list already cites, then propagates
fNRB and KPT sampling uncertainty through `erPerHH` as a distribution, not a point.

**How.** (1) `ref_fnrb_country(iso3, fnrb_default, fnrb_low, fnrb_high, source,
vintage)` table + refdata endpoint, following the platform's Tier-1 reference-data
pattern. (2) Monte Carlo over fNRB, baseline fuel (KPT CV), and rebound — the platform's
standardized PRNG conventions apply — reporting P5/P50/P95 net credits alongside the
existing deterministic `netCredits = totalER × 0.90`. (3) Show which conservativeness
deduction binds: the flat 10% buffer or the P25 statistical bound.

**Prerequisites.** fNRB source vintages documented per §8 model-card convention; the
synthetic 8-project portfolio labeled as demo data. **Acceptance:** same inputs with
Kenya vs Ghana fNRB defaults produce different, source-cited ER ranges; P50 matches the
deterministic path within 1%.

### 9.2 Evolution B — Methodology copilot with in-page what-ifs (LLM tier 1 → 2)

**What.** A copilot that explains the AMS-II.G identity the page actually implements
(`erPerHH = bePerHH × (1 − rebound) − pjEmissions`, fNRB applied to both baseline and
project — a subtlety §7 documents as a deliberate correction) and answers "why did
credits drop when I raised stove efficiency?" from the live calculator state. Because
`calcCleanCooking` is a real deterministic function, the tier-2 step can execute
what-ifs ("assume fNRB 0.55, 40% adoption") by re-invoking the page calculator with
LLM-proposed parameters and narrating only the returned numbers.

**How.** Tier 1: atlas §5/§7 as RAG corpus, current input panel + results passed as
context. Tier 2: a client-side tool schema wrapping `calcCleanCooking` and `fnrbCalc`
(no backend exists to call — this module has no API routes), with the no-fabrication
validator checking answer numerics against tool returns.

**Prerequisites.** Evolution A's fNRB reference table, so the copilot cites sources
rather than seed values. **Acceptance:** every ER figure in an answer matches a
calculator invocation logged in the conversation; "what's the VER price?" is refused as
outside the module's computed surface.
