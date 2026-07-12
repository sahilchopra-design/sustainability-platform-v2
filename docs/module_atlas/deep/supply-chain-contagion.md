## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `Impact = Σ(P(disruption_tier_n) ×
> Revenue_impact × Duration)`. **This calculation does not exist anywhere in the code.** Each
> `CHOKEPOINTS` entry carries a `prob` field, but it is only ever rendered as a percentage
> (`(cp.prob×100).toFixed(0)+'%'`) — it is never multiplied by a revenue-impact or duration figure to
> produce an expected-loss number. The `CASCADE_STEPS` narrative has fixed `lossM` values per step,
> not derived from any probability-weighted calculation either. What the module actually provides is
> a well-researched **static reference dataset** (real chokepoints, real 2023 events) plus a
> **scripted illustrative cascade narrative** — descriptive, not a computed risk model.

### 7.1 What the module computes

15 hand-typed portfolio companies (`COMPANIES`) with Tier 1/2/3 supplier counts (`t1/t2/t3`),
`hazardZones` count, `exposure` (0–100), and `revImpact` ($M) — all fixed literals, no `sr()`
generation for the core data. The only randomised element is cosmetic: `networkNodes` positions
(x/y coordinates for the first 8 companies) use `sr()` purely to jitter node placement in the network
graph visualisation, with **no effect on any numeric result**.

5 real global trade **chokepoints** (`CHOKEPOINTS`): Suez Canal, Malacca Strait, Panama Canal, Taiwan
Strait, Rhine River — each with a real hazard type, a hand-estimated annual disruption probability,
real trade-volume figures, and (for several) **genuine, verifiable 2022–2023 events** cited in the
`details` field:

- Panama Canal: *"2023 drought reduced daily transits from 38 to 24; Gatun Lake levels"* — a real,
  widely reported event (ACP transit restrictions during the 2023 El Niño drought).
- Taiwan Strait: *"90% advanced semiconductors; TSMC concentration risk"* — a real, well-documented
  structural concentration risk.
- Rhine River: *"2022 drought reduced barge capacity to 25%"* — a real, reported 2022 European
  drought impact on Rhine shipping.

An 8-step scripted **cascade narrative** (`CASCADE_STEPS`) walks a Thailand-flood → Japan Tier-1
inventory depletion → European OEM line pause → dealer shortage → recovery sequence over 90 days,
each step tagged with a fixed cumulative loss estimate ($0M→$420M peak→$180M residual after
recovery) — a plausible, well-constructed illustrative scenario, not a Monte Carlo or probability-
weighted simulation.

### 7.2 Parameterisation

| Field | Provenance |
|---|---|
| `COMPANIES` (15 rows, t1/t2/t3, exposure, revImpact) | Hand-typed, plausible, internally consistent (e.g. `LogiTrans Corp` and `GlobalRetail PLC` — logistics/retail sectors — correctly show the largest Tier 2/3 supplier counts, reflecting real-world diffuse supply chains in those sectors) |
| `CHOKEPOINTS` `prob` (8–22%) | Hand-estimated annual disruption probabilities; directionally sensible (Panama Canal highest at 22%, reflecting recurrent drought risk; Malacca lowest at 8%) but not cited to a specific risk model |
| `CASCADE_STEPS` `lossM` | Fixed narrative figures, plausible magnitude progression for an auto-sector disruption, not computed from `COMPANIES`' own `revImpact` fields |
| `MITIGATIONS` (6 strategies, cost + `riskReduction`%) | Real, standard supply-chain resilience levers (dual-sourcing, inventory buffer, nearshoring, resilient logistics routing, supplier audits, parametric insurance) with plausible cost/effectiveness estimates |

### 7.3 Calculation walkthrough

1. **Supply Chain Map / Tier Exposure tabs** — `tierData` reshapes `COMPANIES` for a stacked
   Tier1/2/3 bar chart; purely a display transform of the static table.
2. **Contagion Network Graph** — `networkNodes` places the first 8 companies on a circular layout
   (`cos/sin(i×π/4)`) with small `sr()`-jitter, sized by `revImpact/20` — a force-directed-style
   visual, not an actual graph-theoretic centrality/contagion calculation.
3. **Chokepoint Analysis** — displays the 5 real chokepoints' probability, trade volume, affected
   company count, alternative-route penalty, and impact tier — descriptive table, no aggregation
   into a portfolio-level expected loss.
4. **Cascade Simulation** — `cascadeSpeed` presumably controls playback speed of the 8-step
   narrative (implementation not confirmed beyond the state variable); the loss trajectory itself is
   fixed regardless of speed.
5. **Risk Mitigation Strategies** — static comparison table of the 6 `MITIGATIONS`.

### 7.4 Worked example

The guide's formula would compute, e.g., Panama Canal's expected annual impact as
`P(disruption)×RevenueImpact×Duration`. Using the chokepoint's own `prob=0.22` and, illustratively,
the average `revImpact` across the 7 companies it lists as affected — but **no such combination is
performed anywhere in the code**; a user sees `22%` in the probability column and a set of
independently-computed `revImpact` figures on unrelated company records, with no code path joining
them into an expected-loss figure.

### 7.5 Companion analytics

- **Watchlist** — a user-toggleable set of "at risk" companies (pre-seeded with SemiConductor Co,
  GlobalRetail PLC, LogiTrans Corp — the three highest-`exposure` companies in the table, a sensible
  curation choice).
- **Real historical grounding** — the chokepoint `details` fields are a genuine strength of this
  module: verifiable, specific, dated real-world events rather than generic placeholder text.

### 7.6 Data provenance & limitations

- No expected-loss / probability-weighted impact calculation exists despite being the guide's
  headline formula — a genuine gap for a module whose entire premise is quantifying contagion risk.
- `COMPANIES` are fictional (plausible sector-typical names), not real portfolio holdings, despite
  the guide's dataPoint claiming "15 portfolio companies."
- `CASCADE_STEPS` is a single fixed scenario, not a simulation — there is no mechanism to run a
  different disruption origin/severity and see a different cascade path.

**Framework alignment:** INFORM Risk Index / EM-DAT (named in guide as data sources, not ingested) ·
real global chokepoint geography and 2022–2023 drought/geopolitical events (genuinely, specifically
cited) · standard supply-chain resilience mitigation taxonomy (dual-sourcing, buffer stock,
nearshoring, parametric insurance — all real, recognised strategies).
