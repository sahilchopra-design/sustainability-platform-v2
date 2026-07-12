## 9 · Future Evolution

### 9.1 Evolution A — Higher-fidelity climate physics and Monte Carlo simulation (analytics ladder: rung 2 → 4)

**What.** `builder_engine` powers a custom-scenario builder over 102 hub scenarios: a user overrides
trajectory year-values and the engine recomputes climate/economic/risk consequences using a linear
TCRE model (`temperature = 1.1°C + TCRE × cumulative CO₂`, TCRE = 0.45°C/1000GtCO₂ per AR6),
carbon-budget probabilities (`P(≤1.5°C) = clamp((1 − cum/400Gt)×100)`), and 1–10 risk scores
(`physical = (T₂₁₀₀ − 1.0)×3.5`, `transition = CP₂₀₅₀/60`). It's real scenario work grounded in
hub data, but the climate response is a single linear TCRE relation and the physical/transition
risk mappings are coarse linear transforms. It stores Monte Carlo runs (`/simulations/{id}`) but the
methodology depth is limited. Evolution A raises fidelity.

**How.** (1) Replace the single-line TCRE temperature with a small ensemble (TCRE uncertainty range
+ non-CO₂ forcing term) so temperature carries a distribution, not a point — the carbon-budget
probabilities then reflect real uncertainty rather than a deterministic clamp. (2) Ground the
physical/transition 1–10 risk mappings in the platform's damage-function and NGFS data rather than
the `×3.5` and `/60` linear transforms. (3) Build out the Monte Carlo simulation into a genuine
parameter-uncertainty sweep (rung 4) feeding `/simulations/{id}`. (4) Fix the failing
`/custom/{cs_id}` read and bench-pin the TCRE/budget math.

**Prerequisites.** An AR6-consistent TCRE/forcing ensemble; damage-function linkage; `/custom/{id}`
repaired. **Acceptance:** temperature and budget probabilities carry uncertainty bands; risk scores
derive from calibrated functions, not linear transforms; `/simulations` returns a real parameter
sweep; `/custom/{cs_id}` returns `passed`; core physics bench-pinned.

### 9.2 Evolution B — Scenario-construction copilot (LLM tier 2)

**What.** A copilot that helps a user build and interpret a custom scenario — "start from NGFS
Delayed Transition, cut 2030 coal faster, and tell me what that does to my 2100 temperature and
transition risk" — calling `/calculate-impacts` and narrating the recomputed climate/risk block,
then saving via the custom-scenario CRUD.

**How.** Rich endpoint set: `/base-scenarios` (102 hub scenarios), `/calculate-impacts`,
`/simulate`, and custom-scenario CRUD (`/custom`, fork, PUT/DELETE). The copilot's value is
translating natural-language scenario intent into trajectory overrides and explaining the physics
(TCRE, carbon budget) behind the result. Fork/save are the gated write actions. Central node for a
climate-strategy desk, feeding scenarios to the transition-risk and prudential copilots.

**Prerequisites.** Evolution A's fidelity upgrade for defensible temperature/risk narration — a
copilot presenting linear-TCRE point estimates as projections needs the uncertainty caveat.
**Acceptance:** every temperature, budget probability, and risk score traces to a
`/calculate-impacts` response; the copilot explains the TCRE/budget basis and its uncertainty; save/
fork actions log to audit; it refuses to present a single scenario as a forecast.
