# Supply Chain Climate Contagion
**Module ID:** `supply-chain-contagion` · **Route:** `/supply-chain-contagion` · **Tier:** A (backend vertical) · **EP code:** EP-CG3 · **Sprint:** CG

## 1 · Overview
15 portfolio companies with Tier 1/2/3 supplier mapping, 5 chokepoint analysis, and cascade simulation.

**How an analyst works this module:**
- Supply Chain Map shows Tier 1/2/3 network
- Chokepoint Analysis identifies geographic bottlenecks
- Cascade Simulation runs disruption scenarios with speed control

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CASCADE_STEPS`, `CHOKEPOINTS`, `COMPANIES`, `MITIGATIONS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMPANIES` | 16 | `sector`, `t1`, `t2`, `t3`, `hazardZones`, `exposure`, `revImpact` |
| `CHOKEPOINTS` | 6 | `hazard`, `prob`, `tradeVol`, `affectedCo`, `altRoute`, `impact`, `details` |
| `CASCADE_STEPS` | 9 | `event`, `day`, `status`, `lossM` |
| `MITIGATIONS` | 7 | `cost`, `riskReduction`, `timeline`, `priority` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Supply Chain Map','Contagion Network Graph','Tier 1/2/3 Exposure','Chokepoint Analysis','Cascade Simulation','Risk Mitigation Strategies'];` |
| `tierData` | `COMPANIES.map(c => ({ name: c.name.length > 14 ? c.name.slice(0, 14) + '..' : c.name, t1: c.t1, t2: c.t2, t3: c.t3 }));` |
| `networkNodes` | `COMPANIES.slice(0, 8).map((c, i) => ({` |
| `prev` | `i > 0 ? acc[i - 1].cumulative : 0;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/supply-chain/scope3/calculate` | `calculate_scope3` | api/v1/routes/supply_chain.py |
| POST | `/api/v1/supply-chain/scope3/sbti-target` | `calculate_sbti_target` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/emission-factors` | `list_emission_factors` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/assessments` | `list_scope3_assessments` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/assessments/{assessment_id}` | `get_scope3_assessment` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/sbti-targets` | `list_sbti_targets` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/sbti-targets/{target_id}` | `get_sbti_target` | api/v1/routes/supply_chain.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `base` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `emission_factor_library` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sbti_targets` *(shared)*, `sbti_trajectories` *(shared)*, `scope3_activities` *(shared)*, `scope3_assessments` *(shared)*, `sqlalchemy` *(shared)*, `this` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CASCADE_STEPS`, `CHOKEPOINTS`, `COMPANIES`, `MITIGATIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Chokepoints | — | Geopolitical analysis | Suez, Malacca, Panama, Taiwan Strait, Rhine |
| Max Cascade Revenue Impact | `Worst-case simulation` | Model | Single Tier 2 flood event cascading to 3 portfolio companies |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/supply-chain/emission-factors** — status `passed`, provenance ['real-db'], source tables: `emission_factor_library`
Output: `{'type': 'object', 'keys': ['total_count', 'filters_applied', 'factors', 'validation_summary'], 'n_keys': 4}`

**GET /api/v1/supply-chain/scope3/assessments** — status `passed`, provenance ['real-db'], source tables: `scope3_assessments`
Output: `{'type': 'object', 'keys': ['assessments', 'total_count'], 'n_keys': 2}`

**GET /api/v1/supply-chain/scope3/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `scope3_assessments`
Output: `None`

**GET /api/v1/supply-chain/scope3/sbti-targets** — status `passed`, provenance ['real-db'], source tables: `sbti_targets`
Output: `{'type': 'object', 'keys': ['targets', 'total_count'], 'n_keys': 2}`

**GET /api/v1/supply-chain/scope3/sbti-targets/{target_id}** — status `failed`, provenance ['db-empty'], source tables: `sbti_targets`
Output: `None`

**POST /api/v1/supply-chain/scope3/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/supply-chain/scope3/sbti-target** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Network cascade propagation
**Headline formula:** `Impact = Σ(P(disruption_tier_n) × Revenue_impact × Duration)`

Supply chain modelled as directed acyclic graph. Disruption at Tier 3 propagates upstream with attenuation factor per tier. Chokepoints (Suez, Malacca, Panama, Taiwan Strait, Rhine) create correlated multi-company disruption.

**Standards:** ['INFORM Risk Index', 'EM-DAT']
**Reference documents:** INFORM Risk Index; EM-DAT Disaster Database

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **81** other module(s).

| Connected module | Shared via |
|---|---|
| `supply-chain-esg-hub` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-labor-climate` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-map` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-resilience` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-emissions-mapper` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-network-viz` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-carbon` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `climate-underwriting-workbench` | table:exc, table:sqlalchemy |
| `insurance-transition` | table:exc, table:sqlalchemy |
| `insurance-protection-gap` | table:exc, table:sqlalchemy |

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

## 9 · Future Evolution

### 9.1 Evolution A — Build the probability-weighted cascade simulation the guide names (analytics ladder: rung 1 → 3)

**What.** The §7 flag identifies the core gap: the guide's `Impact = Σ(P(disruption_tier_n) × Revenue_impact × Duration)` **does not exist** — each `CHOKEPOINTS` entry carries a `prob` field, but it is only rendered as a percentage, never multiplied by revenue-impact or duration to produce an expected loss, and `CASCADE_STEPS` has fixed `lossM` values, not probability-weighted outputs. The module's genuine strengths are real: 5 accurately-researched global chokepoints (Suez, Malacca, Panama, Taiwan Strait, Rhine) with verifiable 2022–2023 events (Panama drought transit cuts, Rhine low-water, TSMC concentration), and a well-structured DAG framing. But it's a static reference + scripted narrative, not a computed risk model. Blast radius is 81. Evolution A builds the simulation.

**How.** (1) Implement the expected-loss calculation: for each chokepoint/tier, `P(disruption) × revenue-impact × duration`, aggregated to portfolio contagion risk — the guide's formula. (2) Make the cascade a real simulation: parameterise disruption origin, severity, and speed so a user can run a different scenario (Thailand flood vs Taiwan Strait closure) and see a different cascade path, rather than the single fixed 8-step narrative. (3) Model upstream attenuation per tier (the DAG propagation the guide describes) as an actual factor. (4) Replace fictional `COMPANIES` with real portfolio holdings joined via the shared supply-chain backend, and ground chokepoint probabilities in INFORM Risk Index / EM-DAT (named but not ingested).

**Prerequisites.** A cascade-propagation engine (the DAG structure is defined); INFORM/EM-DAT ingestion for probabilities; real holdings join. **Acceptance:** expected loss = P × impact × duration computes per chokepoint; changing the disruption origin produces a different cascade path; chokepoint probabilities cite INFORM/EM-DAT.

### 9.2 Evolution B — Supply-chain disruption war-gaming copilot (LLM tier 2)

**What.** A copilot for the resilience analyst: "simulate a Taiwan Strait closure and show the cascade through my portfolio", "which of my holdings are most exposed to the Panama chokepoint?", "what mitigation reduces contagion risk most?" — driving the (Evolution-A) cascade simulation and narrating the propagation, expected losses, and mitigation options (dual-sourcing, buffer stock, nearshoring, parametric insurance — the real taxonomy the module carries).

**How.** Tier-2 pattern once the simulation exists: the cascade-run becomes a tool taking origin/severity/speed; the copilot narrates the propagation path, per-company revenue impact, and recovery timeline, citing the real chokepoint geography and events. Mitigation answers evaluate the `MITIGATIONS` options against the simulated cascade. The no-fabrication validator checks every loss figure against the simulation output.

**Prerequisites (hard).** Evolution A — with no expected-loss calc and only a single scripted cascade, the copilot could only re-narrate fixed demo losses; war-gaming requires the parameterised simulation. **Acceptance:** every loss/impact figure traces to a simulation run with stated parameters; a different disruption origin yields a different narrated cascade; chokepoint facts match the researched real events.