## 9 · Future Evolution

### 9.1 Evolution A — Live grid-CI coupling and benchmarked learning curve (analytics ladder: rung 1 → 3)

**What.** §7 confirms `netCalc` is a real DAC net-removal engine (energy, sorbent,
construction, transport deductions; permanence adjustment) but its energy channel uses
three hard-coded emission factors (`Renewable 0.02 / Grid Mix 0.45 / Natural Gas 0.20`
tCO₂/MWh) and the cost trajectory is a synthetic `600×0.92^i + sr()` series. Evolution A
wires the grid-CI input to the platform's already-integrated EIA and ENTSO-E feeds so a
DAC facility's net removal reflects its actual balancing-area carbon intensity, and
replaces the seeded learning curve with one anchored to published deployment data (DOE
DAC Shot baselines, IEA CCUS 2024 capacity — both already in the module's reference
list).

**How.** (1) Grid-CI resolver: location → balancing area → trailing-12-month average
and marginal CI, with the honest-fallback pattern (`resolution_tier` reported when only
country averages exist). (2) Learning-curve fit re-estimated from cumulative-capacity
observations rather than `Math.pow(0.92,i)`; parameters and fit error published per §8
model-card convention. (3) Scenario grid over energy source × §45Q/EU Innovation Fund
policy cases the Policy tab already enumerates.

**Prerequisites.** Kill the `sr()` seeded-random jitter in the cost series (platform
random-as-data guardrail applies); EIA/ENTSO-E ingester coverage for the target
regions. **Acceptance:** the same facility on ERCOT vs a renewable PPA shows different
`netRemoval` and `costPerNetTonne` with the CI source cited; learning-rate parameter
carries a fit-error stat, not an assumption.

### 9.2 Evolution B — DAC feasibility copilot (LLM tier 1)

**What.** A copilot answering the questions this module's economics actually turn on:
"why is my cost per net tonne 40% above LCOD?" (because the denominator is net of
lifecycle deductions — §7 documents this exact mechanic), "at what grid CI does net
removal go negative?", "how does §45Q change breakeven?". Grounded in the atlas §5
formulas and the live `netCalc` output on screen; refuses market questions (credit
prices, offtake demand) the engine does not compute.

**How.** Tier-1 pattern: atlas record chunks in `llm_corpus_chunks`, page state
(technology, energy source, deduction percentages, results) injected as structured
context; Haiku-tier serving with prompt caching since the module corpus is stable. The
breakeven-CI question is answerable by the LLM restating the closed-form threshold from
§5, not by computing new numbers.

**Prerequisites.** None beyond the tier-1 copilot router — this module's calculator
is real and its guide matches its code, so the corpus is trustworthy today.
**Acceptance:** copilot correctly attributes the gross-vs-net cost wedge to lifecycle
deductions with a §7 citation; adversarial probe on 2050 credit prices produces a
refusal.
