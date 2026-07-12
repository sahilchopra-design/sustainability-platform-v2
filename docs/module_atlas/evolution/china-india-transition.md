## 9 · Future Evolution

### 9.1 Evolution A — Economics-driven coal retirement model (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's `Coal_retirement = f(policy, economics, RE_growth)`
does not exist — phase-down capacities are hard-coded fast/base/slow tables, and the
only real computation is the logistic RE S-curve
(`val = start + (peak−start)/(1+e^(−k(y−mid)))`). Evolution A builds the advertised
function honestly scoped: a plant-cohort retirement model where each vintage cohort of
the China (1,100GW) and India coal fleets retires when its going-forward cost exceeds
the RE-plus-storage LCOE implied by the S-curve the page already computes, with policy
levers (China ETS carbon price from the `CARBON_PRICE_PATHS` trajectory, India's RPO
trajectory) shifting the crossover year per cohort.

**How.** (1) Cohort table (commissioning-year buckets × heat rate × fuel cost) built
from published CEA (India) and China Electricity Council fleet statistics rather than
invented plants. (2) Retirement rule: retire when `fuel + VOM + carbon_price ×
emission_intensity > RE_LCOE(y) + firming`; the fast/base/slow presets become named
parameterisations of carbon-price and RE-cost assumptions instead of hard-coded
outputs. (3) The existing S-curve generator is reused as the RE-cost/deployment input —
the one real engine on the page becomes the model's driver.

**Prerequisites.** Fleet statistics sourced and vintaged; the hard-coded scenario
tables retained as validation targets (the model should roughly reproduce the "base"
table, and the delta is informative). **Acceptance:** raising the China ETS price path
pulls cohort retirements earlier, monotonically; a single-cohort fixture reproduces
the crossover year by hand.

### 9.2 Evolution B — Dual-market policy copilot (LLM tier 1)

**What.** A copilot over the curated intelligence this module actually contains: "which
sectors does the China ETS cover and since when?" (the 9-row `CHINA_ETS_SECTORS`
table), "what is India's green hydrogen mission funding and target?" (`INDIA_H2_DATA`),
"compare the two carbon-price trajectories" (13-point `CARBON_PRICE_PATHS`, actual vs
projected clearly distinguished). Tier-1 explainer over reference tables and the §5
sources (IEA India Energy Outlook, China MEE ETS regulations) — no computation to call
until Evolution A ships.

**How.** Atlas record plus seed tables in `llm_corpus_chunks`, with each table's
curation vintage stamped; the copilot must label projected price-path values as
projections (the `china_actual` vs `china_proj` field split already encodes this).
Post-Evolution A, retirement-model runs become client-side tool calls and the copilot
graduates to tier 2.

**Prerequisites.** Vintage stamps on the curated tables — both markets move fast (CCER
restart, India CCTS launch) and unstamped narration would assert stale policy as
current. **Acceptance:** every policy fact cites a table row with its as-of date;
asked for next year's CEA auction outcome, the copilot refuses.
