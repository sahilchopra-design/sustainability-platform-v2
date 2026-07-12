# Cascading Default Modeler
**Module ID:** `cascading-default-modeler` · **Route:** `/cascading-default-modeler` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Network-based credit contagion model where one company default triggers counterparty distress. Climate shocks as exogenous triggers with sector correlation matrix.

> **Business value:** Climate-driven credit events are not independent — they hit sectors simultaneously and propagate through supply chain and financial networks. This module quantifies the systemic amplification of climate shocks, identifying which companies are cascade hubs requiring heightened supervisory attention.

**How an analyst works this module:**
- Network Topology shows interconnected entities as graph
- Climate Trigger configures shock severity and sector
- Cascade Simulation runs contagion with speed control
- Systemic Risk Dashboard identifies hubs driving cascade risk
- Capital Buffer Analysis shows how much capital prevents cascade

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CONC_LIMITS`, `Card`, `ENTITIES`, `ENTITY_INDEX`, `INTERCO_RATIO`, `KPI`, `LIABILITY_MATRIX`, `L_TOTALS`, `SECTORS_AGG`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ENTITIES` | 9 | `name`, `sector`, `exposure`, `pd`, `lgd`, `interconnections`, `deltaCoVaR`, `capitalHit` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ENTITY_INDEX` | `Object.fromEntries(ENTITIES.map((e, i) => [e.id, i]));` |
| `totalLiability` | `e.exposure * INTERCO_RATIO;` |
| `share` | `cps.length ? totalLiability / cps.length : 0;` |
| `L_TOTALS` | `LIABILITY_MATRIX.map(row => row.reduce((s, x) => s + x, 0));` |
| `stress` | `severity * (carbonPrice / 120); // = 1.0 at slider defaults ($120, 1.0x)` |
| `buffer` | `1.15 - (e.pd * e.lgd) * stress * 3.5;` |
| `Ltot` | `L.map(row => row.reduce((s, x) => s + x, 0));` |
| `delta` | `Math.max(...next.map((v, i) => Math.abs(v - p[i])));` |
| `shortfall` | `p.map((v, i) => Math.max(0, Ltot[i] - v));` |
| `CONC_LIMITS` | `SECTORS_AGG.map((s,i)=>({ sector:s, currentExposure:ENTITIES.filter(e=>e.sector===s).reduce((a,e)=>a+e.exposure,0), limit:5000+i*500, utilization:0 }));` |
| `totalExposure` | `ENTITIES.reduce((s,e)=>s+e.exposure,0);` |
| `totalCapHit` | `ENTITIES.reduce((s,e)=>s+e.capitalHit,0);` |
| `avgCoVaR` | `ENTITIES.reduce((s,e)=>s+e.deltaCoVaR,0)/Math.max(1,ENTITIES.length);` |
| `cascadeData` | `useMemo(() => network.history.map((p, iter) => {` |
| `lossAccum` | `Math.round(p.reduce((s, v, i) => s + Math.max(0, network.Ltot[i] - v), 0));` |
| `loanLoss` | `useMemo(()=>ENTITIES.map(e=>({...e,el:Math.round(e.exposure*e.pd*e.lgd*severity),uel:Math.round(e.exposure*e.pd*e.lgd*severity*2.5)})),[severity]);` |
| `receivedByCp` | `owed > 0 ? (owedToCp / owed) * paid : 0;` |
| `cpShortfall` | `owedToCp - receivedByCp;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITIES`, `SECTORS_AGG`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Entities | — | Network | Nodes in corporate network |
| Cascade Rounds | — | Simulation | Contagion propagation rounds before equilibrium |
| Systemic Loss | — | Model | Total losses from cascade vs primary default only |
- **Corporate network topology** → Climate shock application → **Initial default probabilities**
- **Default probabilities** → Contagion propagation → **Cascade loss estimates**
- **Network losses** → Systemic risk quantification → **Capital adequacy assessment**

## 5 · Intermediate Transformation Logic
**Methodology:** Network contagion with climate triggers
**Headline formula:** `P(contagion) = 1 - ∏(1 - P(default_i) × Connectivity_ij)`

Climate trigger: carbon price shock → sector EBITDA collapse → first default → contagion to counterparties via supply chain and financial linkages. Network topology: scale-free distribution means a few hubs drive most contagion.

**Standards:** ['Eisenberg-Noe (2001)', 'NGFS']
**Reference documents:** Eisenberg & Noe (2001) Systemic Risk; Acemoglu et al. (2015) Network Economics of Climate; FSB Systemic Risk Assessment

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch.** The guide describes an *Eisenberg-Noe network contagion* model with the
> fixed-point formula `P(contagion) = 1 − ∏(1 − P(default_i) × Connectivity_ij)`, scale-free topology, and
> 3–5 propagation rounds to equilibrium. **The code implements none of that.** It uses a **pre-scripted,
> linear cascade chain** (`CHAIN_STEPS`, 6 hard-coded stages) whose accumulated losses are simply scaled by
> user severity and carbon price: `lossAccum × severity × (carbonPrice/120)`. There is no network fixed-
> point solve, no ∏-product contagion probability, no propagation rounds. `ΔCoVaR` and `capitalHit` are
> stored per-entity constants, not computed. The 8 entities carry PD/LGD/exposure but they never actually
> default one another. Sections below document the code.

### 7.1 What the module computes

Two deterministic transforms over hand-set data:

```js
cascadeData = CHAIN_STEPS.map(s => lossAccum = round(s.lossAccum × severity × carbonPrice/120))
loanLoss    = ENTITIES.map(e => ({ el:  exposure×pd×lgd×severity,          // expected loss
                                   uel: exposure×pd×lgd×severity×2.5 }))    // "unexpected" = 2.5×EL
totalExposure = Σ exposure ; totalCapHit = Σ capitalHit ; avgCoVaR = mean(ΔCoVaR)
```

The "cascade" is a scripted 6-step storyline (Stranded Asset → Covenant Breach → Loan Default → Bank Capital
Hit → Credit Tightening → Sector Contagion) with pre-assigned cumulative losses, scaled linearly by the two
sliders. The loan-loss panel is a standard `EL = EAD × PD × LGD` calculation with a flat 2.5× multiplier
labelled "unexpected loss".

### 7.2 Parameterisation

**Entities** (`ENTITIES`, 8 high-carbon obligors — provenance: hand-curated illustrative, realistic PD/LGD):

| Entity | Sector | Exposure ($M) | PD | LGD | ΔCoVaR |
|---|---|---|---|---|---|
| PetroGlobal | Oil & Gas | 5,200 | 0.12 | 0.55 | 0.068 |
| PowerGen Alpha | Power Gen | 4,500 | 0.11 | 0.48 | 0.058 |
| MiningDeep | Mining | 3,600 | 0.16 | 0.60 | 0.055 |
| CoalCo | Coal Mining | 2,400 | 0.18 | 0.65 | 0.042 |

`interconnections` lists 3 counterparties per entity (a network *is* declared) but the edges are never used
in a contagion calculation. `ΔCoVaR` (systemic-risk contribution) and `capitalHit` are stored constants.

**Cascade chain** (`CHAIN_STEPS`): pre-set cumulative losses 0 → 420 → 1,240 → 2,100 → 3,800 → 6,200 ($M)
with narrative triggers (carbon price >$120/t, leverage >4.5×, CET1 below buffer). The `carbonPrice/120`
divisor anchors the base case at $120/t.

### 7.3 Calculation walkthrough

Sliders set `severity` (1.0 base) and `carbonPrice` (120 base). The cascade chart multiplies each stage's
stored `lossAccum` by `severity × carbonPrice/120`. The loan-loss table computes `EL` and `UEL = 2.5×EL`
per entity, scaled by severity. Concentration limits sum exposure per sector against a `5000 + i×500` limit.
None of these steps propagate a default through the `interconnections` graph.

### 7.4 Worked example (cascade + loan loss)

Base cascade at severity=1.0, carbonPrice=120: multiplier = `1.0 × 120/120 = 1.0`, so stages read
0/420/1,240/2,100/3,800/6,200. Stress to carbonPrice=180, severity=1.5: multiplier = `1.5 × 180/120 = 2.25`
→ Sector Contagion stage = `6,200 × 2.25 = 13,950 $M`. The amplification is purely the linear scalar, not a
network effect.

Loan loss, PetroGlobal at severity=1.0: `EL = 5,200 × 0.12 × 0.55 = 343.2 $M`; `UEL = 343.2 × 2.5 = 858 $M`.
The `EL` is a correct Basel expected-loss; the 2.5× UEL multiplier is a heuristic, not a modelled tail.

### 7.5 Data provenance & limitations

- Entities are **hand-curated illustrative** (realistic PD/LGD/exposure); the cascade losses are pre-scripted
  constants. Severity/carbon-price scaling is linear.
- **No network contagion is actually computed** — the guide's Eisenberg-Noe fixed point and ∏-product
  formula are unimplemented; `interconnections` is decorative.
- `ΔCoVaR` is stored, not estimated from a quantile regression; UEL is a flat 2.5×EL, not a modelled 99.9%
  tail.

**Framework alignment:** Basel IRB — the `EL = EAD × PD × LGD` loan-loss core is correct · Eisenberg-Noe
(2001) systemic risk — *named* but not implemented (see §8) · Adrian-Brunnermeier CoVaR — the ΔCoVaR metric
is displayed but not estimated · NGFS — carbon price as the exogenous transition trigger. See §8 for the
production contagion model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The scripted cascade should be replaced by a real
network-contagion solve.

### 8.1 Purpose & scope
Quantify systemic amplification when a climate/carbon-price shock triggers correlated defaults that propagate
through a corporate credit network, identifying cascade-hub obligors for supervisory attention and sizing
the capital buffer that arrests contagion.

### 8.2 Conceptual approach
Eisenberg-Noe clearing-payment fixed point on an interbank/counterparty liability matrix, with a climate
shock as the exogenous asset-value hit, benchmarked against the FSB/ECB systemic-risk frameworks and
Battiston et al. (2017) climate stress-test networks (DebtRank). ΔCoVaR estimated by quantile regression of
system loss on entity distress.

### 8.3 Mathematical specification

```
Shock:   A_i' = A_i × (1 − δ_i(carbonPrice))          asset value after carbon shock, δ from PD uplift
Clearing (Eisenberg-Noe): p*_i = min( L_i ,  A_i' + Σ_j Π_ji p*_j )    relative liability matrix Π
Default set:  D = { i : p*_i < L_i }
DebtRank:    h_i(t+1) = min(1, h_i(t) + Σ_j W_ij h_j(t))    W = impact-weighted edges
SystemicLoss = Σ_i (L_i − p*_i)
ΔCoVaR_i = CoVaR(system | i distressed) − CoVaR(system | i median)
```

| Parameter | Symbol | Source |
|---|---|---|
| Liability matrix | Π, L | counterparty exposures (supervisory/credit data) |
| Carbon-shock asset hit | δ_i | NGFS transition path × sector carbon intensity |
| Recovery | 1−LGD | Basel/issuer LGD |
| Impact weights | W_ij | exposure_ij / equity_j (DebtRank) |

### 8.4 Data requirements
Bilateral exposure/liability matrix, per-entity assets/equity, sector carbon intensity, NGFS carbon path.
Platform holds entity PD/LGD/exposure and a declared `interconnections` graph; missing: the bilateral
liability matrix and a fixed-point solver.

### 8.5 Validation & benchmarking plan
Verify Eisenberg-Noe existence/uniqueness (convergence of the clearing vector). Backtest against historical
credit-event clusters. Compare DebtRank hub ranking against ΔCoVaR ranking. Buffer analysis: minimum capital
injection that empties the default set. Reconcile against ECB climate stress-test contagion figures.

### 8.6 Limitations & model risk
The liability matrix is rarely fully observed — reconstruction (max-entropy) introduces topology error;
conservative fallback assumes denser connectivity (worse contagion). Fixed-point models omit fire-sale price
dynamics and funding-liquidity spirals, which can amplify beyond the clearing solution — flag results as a
lower bound on systemic loss.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the real Eisenberg-Noe fixed point on a real network (analytics ladder: rung 2 → 4)

**What.** §7's mismatch flag: the guide promises an Eisenberg-Noe network contagion model (`P(contagion) = 1 − ∏(1 − P(default_i) × Connectivity_ij)`, scale-free topology, propagation rounds), but the headline cascade is a **pre-scripted linear chain** (`CHAIN_STEPS`, 6 hard-coded stages) scaled by `severity × carbonPrice/120`, with `ΔCoVaR` and `capitalHit` as stored per-entity constants. That said, the function map shows the seeds of a genuine solve — a `LIABILITY_MATRIX`, payment-vector iteration (`network.history`, `delta = max|v−p|` convergence, `shortfall = max(0, Ltot − p)`) — so a real Eisenberg-Noe clearing solver is partially present but not driving the headline metrics. The 8 entities are seeded. Evolution A completes the real model.

**How.** (1) Make the Eisenberg-Noe clearing vector the actual engine: given the liability matrix L and each node's external assets under a climate shock, solve for the clearing payment vector by fixed-point iteration (the `LIABILITY_MATRIX`/`Ltot`/`shortfall` machinery is the right skeleton) — replacing the `CHAIN_STEPS` linear script. (2) Real network topology from the platform's supply-chain and financial-linkage data (the entity-resolution and supply-chain modules carry counterparty relationships) rather than 8 seeded entities. (3) Climate trigger from real sector shocks: `deltaCoVaR` and `capitalHit` computed from the cascade, not stored. (4) Rung 3-4: calibrate PD/LGD from real credit data and the sector-correlation matrix from observed co-movements; the model becomes predictive of systemic amplification. Extract to a backend route — a systemic-risk solver belongs server-side and deserves a bench_quant pin against a known Eisenberg-Noe test case.

**Prerequisites.** A real counterparty network (supply-chain/financial linkages); PD/LGD calibration data; backend extraction. **Acceptance:** the cascade is a real fixed-point clearing solve (bench-pinned against a textbook Eisenberg-Noe example); ΔCoVaR and capital hits are computed from the cascade; the network derives from real linkages; removing a hub measurably changes systemic loss.

### 9.2 Evolution B — Systemic-risk cascade copilot (LLM tier 2)

**What.** Supervisors and risk teams ask "which entities are cascade hubs?", "what capital buffer prevents contagion under a $200/t carbon shock?", "how much does the cascade amplify losses beyond primary defaults?" — the copilot runs the Evolution-A clearing solver, identifies hubs by their marginal contribution to systemic loss, and reports capital-adequacy scenarios, every figure tool-traced.

**How.** Tool schemas over the Evolution-A cascade/clearing route; grounding corpus is this Atlas record plus the Eisenberg-Noe / NGFS / FSB references in §5. The copilot's core value is the systemic-amplification narrative — "this hub's default triggers 3 rounds of contagion adding $X to primary losses; a $Y buffer contains it" — with every loss and round count from the clearing solver. The honesty duty: contagion models are structurally sensitive to the assumed network and correlation matrix, so the copilot states those inputs per run and presents results across shock severities rather than a single point — systemic risk is inherently scenario-dependent. Feeds the Tier-3 desk orchestrator's systemic-risk view.

**Prerequisites (hard).** Evolution A's real solver and network — a copilot narrating a pre-scripted linear cascade as network contagion would misrepresent systemic risk to supervisors. **Acceptance:** every systemic-loss, hub-ranking, and buffer figure traces to the clearing solver; runs state the network and correlation assumptions; results span shock severities; hub rankings reflect real marginal contribution to loss.