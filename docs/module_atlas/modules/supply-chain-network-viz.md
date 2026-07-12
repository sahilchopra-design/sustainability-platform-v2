# Supply Chain Network Viz
**Module ID:** `supply-chain-network-viz` · **Route:** `/supply-chain-network-viz` · **Tier:** A (backend vertical) · **EP code:** EP-CW3 · **Sprint:** CW

## 1 · Overview
20 nodes + 25 links with risk propagation, critical paths, and 4 geopolitical scenario simulations.

**How an analyst works this module:**
- Network Graph shows positioned nodes with links
- Scenario Simulator models geopolitical supply disruptions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COMPANIES`, `Card`, `KPI`, `LINKS`, `Pill`, `SCENARIOS`, `TABS`, `TIER_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMPANIES` | 21 | `name`, `tier`, `x`, `y`, `risk`, `category` |
| `LINKS` | 26 | `from`, `to` |
| `SCENARIOS` | 5 | `name`, `affectedNodes`, `impactPct` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `companyMap` | `useMemo(() => Object.fromEntries(COMPANIES.map(c=>[c.id,c])), []);` |
| `hhiData` | `useMemo(() => { const cats = [...new Set(COMPANIES.map(c=>c.category))];` |
| `hhi` | `Math.round(nodes.length * (share*100)**2);` |
| `tierAnalysis` | `useMemo(() => [0,1,2,3].map(tier => {` |

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
**Frontend seed datasets:** `COMPANIES`, `LINKS`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Nodes | — | Network | Companies in supply chain |
| Links | — | Relationships | Supplier-customer edges |

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
**Methodology:** Network risk propagation
**Headline formula:** `PropagatedRisk = SourceRisk × DependencyWeight × AttenuationFactor^tier`

SVG network visualization. 4 scenarios: China REE export controls, DRC cobalt disruption, Ukraine neon shortage, Russia PGM sanctions.

**Standards:** ['Network theory']
**Reference documents:** INFORM Risk Index

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **81** other module(s).

| Connected module | Shared via |
|---|---|
| `supply-chain-esg-hub` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-labor-climate` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-map` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-resilience` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-contagion` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-emissions-mapper` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-carbon` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `climate-underwriting-workbench` | table:exc, table:sqlalchemy |
| `insurance-transition` | table:exc, table:sqlalchemy |
| `insurance-protection-gap` | table:exc, table:sqlalchemy |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is
> `PropagatedRisk = SourceRisk × DependencyWeight × AttenuationFactor^tier`, and the page's own
> in-app "Methodology" footer additionally claims the network is "constructed from CDP supply chain
> disclosures, Bloomberg SPLC data," that risk propagation "uses Bayesian network inference with
> conditional probability tables," and that scenario impacts are "estimated using Monte Carlo
> simulation with 10,000 iterations." **None of this is implemented.** The network is a hand-authored
> 20-node/25-edge static graph; the four scenario impact percentages (35%, 42%, 28%, 25%) are
> **hard-coded literals** in the `SCENARIOS` array with no attenuation function, no conditional
> probability tables, and no Monte Carlo loop anywhere in the 277-line file. Sections below document
> the static graph and its descriptive analytics as implemented; §8 specifies the propagation model
> the guide and in-app text claim exists.

### 7.1 What the module computes

A fixed directed graph: 20 companies (`COMPANIES`, one portfolio root `C1` at tier 0, then tiers
1–3) connected by 25 hard-coded edges (`LINKS`). Each company carries a static `risk` score (22–92,
hand-assigned per company, not `sr()`-seeded — e.g. `Cobalt DRC` = 92, `PackagingCo` = 22) and a
`category` (Mining, Semiconductors, Chemicals, REE, PGM, Gas, Materials, Logistics, Packaging,
Portfolio). Four scenarios (`SCENARIOS`) each list a hard-coded `affectedNodes` path and a hard-coded
`impactPct` — there is no computation deriving `impactPct` from the graph structure or node risk
scores.

### 7.2 Derived analytics that ARE computed

Three genuine calculations exist over the static graph:

```js
// Single-point-of-failure detection (critical paths)
isCriticalNode = (inLinks(node) === 1) && (outLinks(node) ≥ 2)

// Herfindahl-Hirschman Index per supplier category
share = 1 / count(nodes in category)
HHI   = count × (share × 100)²                    // = 10000 / count  when shares are equal

// Tier aggregates
avgRisk(tier) = mean(risk) over nodes in tier ;  maxRisk(tier) = max(risk) over nodes in tier
```

The HHI formula simplifies to `10000/count` under the code's equal-share assumption (every node in a
category is implicitly weighted identically — `share = 1/count` for **all** nodes, not
revenue/spend-weighted), which is the textbook HHI formula for `n` equally-sized firms
(`HHI = 10000/n`). Thresholds: HHI > 5000 → 'High' concentration, > 2500 → 'Medium' — these are the
**standard DOJ/FTC Horizontal Merger Guidelines HHI bands** (>2500 highly concentrated market,
1500–2500 moderately concentrated), correctly applied here even though the underlying "market
shares" are node-count proxies rather than true revenue shares.

### 7.3 Calculation walkthrough

1. **Critical-path scan** — for every company, count inbound links (`LINKS.filter(l=>l.to===c.id)`)
   and outbound links; flag as a single point of failure if it has exactly one supplier feeding it
   but feeds ≥2 downstream nodes itself — i.e., a chokepoint whose failure cascades to multiple
   dependents. This is a real graph-topology computation (correct fan-in/fan-out logic), just not
   risk-weighted.
2. **HHI by category** — groups the 20 nodes by `category`, computes `10000/count` per group, bands
   into High/Medium/Low.
3. **Tier analysis** — group by `tier` (0–3), mean and max `risk`.
4. **Scenario impact** — purely a **lookup**: selecting a scenario pill sets `impactPct` and
   `affectedNodes` directly from the static `SCENARIOS` array; the "Risk Propagation" tab and
   "Impact Chain" panel render the fixed node list in array order as if it were a computed cascade
   path, but the ordering is simply the array's literal element order, not a graph traversal (e.g.
   BFS/DFS from the affected tier-3 node to the portfolio root).
5. **Alert toggling** — `alerts` state lets a user manually mark nodes with `risk > 60` for
   monitoring; this is a UI convenience, not a calculation.

### 7.4 Worked example

Category `Mining` contains 6 nodes (`RareMetal Co`, `LithiumPure`, `IronOre Ltd`, `Cobalt DRC`,
`Graphite SA`, `Manganese AU`): `share = 1/6 = 0.1667`; `HHI = 6 × (16.67)² = 6 × 277.8 = 1667` →
below the 2500 'Medium' threshold, so Mining is labelled **'Low'** concentration despite containing
the single highest-risk node in the entire graph (`Cobalt DRC`, risk 92) — illustrating that HHI
(a *count*-based diversification metric) and node-level *risk severity* are orthogonal: a category
can be well-diversified by supplier count while still carrying extreme tail risk from one member.
Compare `REE` (only `REE China`, `id=C11`): `share=1`, `HHI = 1×100² = 10000` → 'High' concentration
(single-source), consistent with real-world rare-earth-element sourcing concentration in China.

### 7.5 Companion analytics

- **Network graph tab** — SVG-rendered node/edge plot with fixed `x,y` pixel coordinates per company
  (design-time layout, not a force-directed or geographic layout); click-to-highlight shows a node's
  direct edges only (1-hop), not transitive downstream impact.
- **Scenario alert configuration** — lets users flag any node with `risk > 60` (11 of 20 nodes
  qualify) for monitoring; purely client-side state, not persisted.

### 7.6 Data provenance & limitations

- **The entire graph is hand-authored placeholder data** — company names (RareMetal Co, Cobalt DRC,
  Neon Gas UA, Palladium RU), risk scores, and edges are illustrative, not sourced from CDP or
  Bloomberg SPLC despite the in-app methodology text's claim.
- Scenario impact percentages are literal constants with no sensitivity to which nodes are selected,
  no attenuation by tier distance, and no Monte Carlo variance — a single point estimate presented
  with false precision (e.g. "-42%" implies a modelled distribution that does not exist).
- HHI is count-based, not revenue/spend-weighted — acceptable as a topology-diversification proxy but
  should not be read as a true market-concentration HHI without spend data.

**Framework alignment:** HHI thresholds (2500/5000) correctly mirror DOJ/FTC merger-guideline
concentration bands. The guide's `AttenuationFactor^tier` decay concept and "Bayesian network
inference" claim reference legitimate supply-chain risk-propagation techniques (used in practice by
e.g. Resilinc and Interos supply-chain risk platforms) but are not implemented; §8 specifies the
production model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Replace the hard-coded scenario `impactPct` literals with a genuine graph-based risk-propagation
model that computes portfolio revenue-at-risk from any node disruption, for supply-chain
concentration/resilience decisioning across the full supplier network (not just the 4 pre-scripted
scenarios).

### 8.2 Conceptual approach

Model the network as a **directed acyclic dependency graph** and propagate disruption probability
downstream using **attenuated conditional-failure propagation**, the same architecture used by
Interos/Resilinc supply-chain risk platforms and consistent with financial-network contagion models
(e.g. Eisenberg-Noe clearing-vector propagation adapted to supply dependency rather than payment
obligations). Attenuation by tier distance reflects that downstream (portfolio-facing) nodes have
substitution/inventory buffers that dampen upstream shocks.

### 8.3 Mathematical specification

```
DependencyWeight(edge i→j) = 1 / fan_in(j)              (equal split across j's direct suppliers,
                                                            refine with spend-share when available)
AttenuationFactor          = 0.75                        (per-tier-hop damping constant)

PropagatedRisk(node j | shock at source s, path length d) =
      SourceRisk(s) × Π_{edges on path s→j} DependencyWeight(edge) × AttenuationFactor^d

PortfolioImpact(scenario) = Σ_{root nodes r venue-exposed}
      PropagatedRisk(r | s) × RevenueShare(r)             (aggregate to –X% revenue exposure)

ExpectedImpact = Σ_scenarios P(scenario) × PortfolioImpact(scenario)     (probability-weighted)
```

| Parameter | Value | Calibration source |
|---|---|---|
| AttenuationFactor | 0.75/tier-hop | Illustrative decay; calibrate from realised historical disruption pass-through (e.g. 2021 chip shortage tier-1→OEM revenue impact studies) |
| DependencyWeight | 1/fan-in | Neutral prior absent spend data; replace with `spend_ij / Σspend` once procurement data is linked |
| Scenario probabilities | — | Should be sourced from geopolitical risk providers (Verisk Maplecroft, Eurasia Group) rather than assumed uniform |
| Monte Carlo iterations | 10,000 (as claimed in-app) | Standard convention for stable tail-percentile estimation; must actually be implemented as a sampling loop, not asserted in UI text |

### 8.4 Data requirements

- Verified edges with spend/volume weight (currently absent — `LINKS` has no weight field).
- Node-level revenue contribution to portfolio (`RevenueShare`) — needs financial consolidation data.
- Historical disruption events with realised recovery time and revenue impact, for attenuation
  calibration.
- Scenario probability inputs from a geopolitical-risk data vendor.

### 8.5 Validation & benchmarking plan

Backtest `PropagatedRisk` against at least one realised disruption (e.g. a historical chip or REE
supply event) comparing modelled vs. actual revenue impact; run the Monte Carlo engine and confirm
convergence (impact-percentile stability) by 10,000 iterations; reconcile HHI-High categories against
`PropagatedRisk`-High nodes — a single-source (HHI=10000) node should also register maximal
propagated risk, providing an internal consistency check.

### 8.6 Limitations & model risk

Equal-split `DependencyWeight` without spend data will misallocate propagated risk across
multi-supplier nodes; a single unweighted attenuation constant cannot distinguish substitutable
commodity inputs (e.g. iron ore) from irreplaceable specialty inputs (e.g. a qualified semiconductor
mask supplier) — a production model should vary `AttenuationFactor` by `substitutability` (already
tracked as a concept in the sibling `supply-chain-resilience` module) rather than applying one global
constant.

## 9 · Future Evolution

### 9.1 Evolution A — Compute graph-based risk propagation instead of hard-coded scenario impacts (analytics ladder: rung 1 → 3)

**What.** The §7 flag catches a double overstatement: the guide's `PropagatedRisk = SourceRisk × DependencyWeight × AttenuationFactor^tier` and the page's own in-app methodology footer (claiming CDP/Bloomberg SPLC data, "Bayesian network inference with conditional probability tables," and "Monte Carlo with 10,000 iterations") are **all unimplemented** — the four scenario impacts (35%, 42%, 28%, 25%) are hard-coded literals with no attenuation function, no CPTs, no Monte Carlo. The genuine content is a hand-authored 20-node/25-edge static graph. But three real calculations do exist: single-point-of-failure detection (`inLinks===1 && outLinks≥2`), a count-based HHI per category (correctly using DOJ/FTC 2500/5000 bands), and critical-path analysis. Blast radius 81. Evolution A builds the propagation model the page claims to have.

**How.** (1) Implement the `AttenuationFactor^tier` propagation the guide names: a disruption at any node propagates upstream through the DAG with per-tier attenuation and dependency weighting, computing portfolio revenue-at-risk — so scenario impacts are *derived from the graph*, not literals. (2) Make scenarios parameterisable (any node/severity), not just the 4 pre-scripted geopolitical events (China REE, DRC cobalt, Ukraine neon, Russia PGM). (3) Either implement the claimed Monte Carlo (propagation with uncertainty over dependency weights) or remove the false-precision "10,000 iterations" methodology claim. (4) Weight the HHI by revenue/spend where data allows (currently count-based). (5) Ground the graph in real supplier relationships via the shared backend.

**Prerequisites.** A DAG-propagation engine; real edge dependency weights; the shared compute-route fixes. **Acceptance:** scenario impact percentages are computed from graph propagation, not literals; a disruption at any node produces a propagated revenue-at-risk; the methodology footer's claims match the implementation.

### 9.2 Evolution B — Network-disruption war-gaming copilot (LLM tier 2)

**What.** A copilot for the supply-chain risk analyst: "simulate an REE export-control disruption and show the propagation through my network", "which nodes are single points of failure?", "where is my worst supplier concentration?" — driving the (Evolution-A) propagation model and narrating the cascade path, revenue-at-risk, SPOF nodes, and HHI concentration.

**How.** Tier-2 pattern once propagation is computed: the disruption-simulation and SPOF/HHI analytics become tools; the copilot narrates propagation with per-tier attenuation, cites the DOJ/FTC HHI bands for concentration verdicts, and identifies critical nodes from the real graph-structure calculations. The no-fabrication validator checks every impact figure against the propagation output; concentration claims cite the HHI thresholds.

**Prerequisites (hard).** Evolution A — with hard-coded scenario impacts and a falsely-claimed Monte Carlo, the copilot would present literal constants as simulation output with invented precision. **Acceptance:** every propagated-impact figure traces to a graph-propagation run; SPOF/HHI claims match the real structural calculations; a disruption at an off-graph node returns "not in network," not an estimate.