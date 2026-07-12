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
