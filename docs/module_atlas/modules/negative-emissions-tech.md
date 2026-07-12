# Negative Emissions Tech
**Module ID:** `negative-emissions-tech` · **Route:** `/negative-emissions-tech` · **Tier:** B (frontend-computed) · **EP code:** EP-CL5 · **Sprint:** CL

## 1 · Overview
6 NETs (DAC, BECCS, enhanced weathering, ocean CDR, biochar, soil carbon) with cost trajectories and portfolio builder.

**How an analyst works this module:**
- NET Overview shows 6 technologies with cost/permanence/scalability
- DAC Cost Trajectory shows 3 learning scenarios
- Portfolio Builder optimizes NET mix for given budget and permanence target

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `KPI`, `NETS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NETS` | 7 | `cost2024`, `cost2030`, `cost2040`, `scalability`, `permanence`, `trl`, `coBenefits`, `risks`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['NETs Overview','DAC Cost Trajectory','BECCS Viability','Enhanced Weathering','Ocean-Based CDR','NET Portfolio Builder'];` |
| `totalScalability` | `NETS.reduce((s,n)=>s+n.scalability,0);` |
| `avgCost2030` | `Math.round(NETS.reduce((s,n)=>s+n.cost2030,0)/NETS.length);` |
| `portfolioResult` | `useMemo(()=>{ const totalPct = portfolioAlloc.reduce((s,a)=>s+a,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NETs | — | IPCC | DAC, BECCS, ERW, ocean CDR, biochar, soil carbon |
| DAC Cost (current) | — | IEA CCUS | Expected to reach $100-200 by 2040 |

## 5 · Intermediate Transformation Logic
**Methodology:** NET portfolio optimization
**Headline formula:** `Minimize: Σ(cost_i × qty_i) subject to: Σ(qty_i) ≥ target, permanence_i ≥ min`

Current costs range from $20/tCO₂ (soil carbon) to $600/tCO₂ (DAC). Portfolio builder optimizes across cost, permanence (1yr-10,000yr), and scalability (MtCO₂/yr potential).

**Standards:** ['IPCC AR6 WGIII Ch.12', 'IEA CCUS']
**Reference documents:** IPCC AR6 WGIII Chapter 12; IEA CCUS Projects Database

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** The MODULE_GUIDES entry describes a **portfolio *optimizer*** —
> `minimize Σ(cost_i·qty_i) s.t. Σqty_i ≥ target, permanence_i ≥ min`. The code's "NET Portfolio Builder"
> is **not an optimiser**: it is a manual allocation calculator that spreads a user's budget across six
> technologies by user-set percentages and computes the resulting removal. Also, the guide says 6 NETs
> including "biochar, soil carbon" — the code has DAC, BECCS, Enhanced Weathering, Ocean Alkalinity,
> Biochar, Soil Carbon (matches). The cost/scalability data is hand-authored realistic; the DAC trajectory
> is a genuine learning-curve model.

### 7.1 What the module computes

The portfolio builder converts budget × allocation into tonnes removed:

```js
totalPct = Σ portfolioAlloc
spend_i  = budget · alloc_i / totalPct
removal_i = (spend_i / cost2030_i) · 1000        // kt CO₂ removed at the 2030 cost
```

The DAC cost trajectory (`dacCostCurve`) is an **exponential learning curve** over 2024–2050:

```js
optimistic  = 400 · e^(−0.06·(yr−2024))
base        = 400 · e^(−0.045·(yr−2024))
conservative= 400 · e^(−0.03·(yr−2024))
```

with an inline note documenting it as Wright's Law `cost = C₀·N^(−b)`, `b = 0.08–0.15`, reaching
$100/tCO₂ after ~50 Mt cumulative deployment.

### 7.2 Parameterisation / scoring rubric

| Technology | cost2024 | cost2030 | cost2040 | scalability (Gt/yr) | permanence (yr) | TRL | Provenance |
|---|---|---|---|---|---|---|---|
| DAC | $400 | $200 | $100 | 5.0 | 10,000 | 7 | Hand-authored (IEA CCUS / IPCC AR6) |
| BECCS | $120 | $90 | $70 | 3.5 | 10,000 | 6 | Hand-authored |
| Enhanced Weathering | $80 | $50 | $30 | 4.0 | 100,000 | 4 | Hand-authored |
| Ocean Alkalinity | $150 | $80 | $50 | 10.0 | 100,000 | 3 | Hand-authored |
| Biochar | $60 | $45 | $35 | 2.0 | 1,000 | 7 | Hand-authored |
| Soil Carbon | $30 | $25 | $20 | 3.0 | 100 | 8 | Hand-authored |

These figures track **IEA CCUS** cost ranges (DAC $400–600 now → ~$100 by 2040) and **IPCC AR6 WGIII Ch.12**
CDR characterisations (permanence ordering: mineral/ocean >10⁴ yr, biochar ~10³, soil ~10² yr). No PRNG —
all constants are hand-set. Companion tables (`beccsData`, `weatheringData`, `oceanCDR`) are likewise
hand-authored technology characterisations.

### 7.3 Calculation walkthrough

`NETS` constants → overview chart + KPI (`totalScalability = Σ scalability`, `avgCost2030`). The DAC tab
plots the three learning-curve scenarios. The portfolio builder: user sets budget + six allocation
percentages → `spend_i` and `removal_i` per technology → total removal and cost-per-tonne. The result is
sensitive to the user's manual mix; it does not solve for the cost-minimising or permanence-constrained
allocation.

### 7.4 Worked example (portfolio builder, $500M budget, default allocation)

`portfolioAlloc = [25,20,20,15,10,10]`, `totalPct = 100`, `budget = $500M`. For DAC (`alloc 25`,
`cost2030 $200`):

| Step | Computation | Result |
|---|---|---|
| DAC spend | `500 · 25/100` | $125M |
| DAC removal | `(125 / 200)·1000` | **625 kt CO₂** |
| Soil Carbon spend | `500 · 10/100` | $50M |
| Soil Carbon removal | `(50 / 25)·1000` | **2,000 kt CO₂** |

Soil Carbon removes 3.2× more per dollar than DAC (cheaper per tonne) — the calculator makes the cost
trade-off visible, but a true optimiser (guide) would push allocation toward the cheapest technologies
subject to the permanence and scalability constraints, which this manual builder does not enforce.

### 7.5 Data provenance & limitations

- **All technology data is hand-authored** and IEA/IPCC-consistent — no PRNG. The DAC learning curve is a
  genuine exponential model with a documented Wright's-Law rationale.
- **No optimisation:** the "builder" is a manual allocation-to-removal calculator; the guide's constrained
  cost-minimisation is not implemented. Permanence and scalability are shown but not enforced as
  constraints.
- Removal uses the flat 2030 cost for all vintages; no deployment-dependent cost decline within the
  portfolio, and no MRV/permanence discounting of removals.

**Framework alignment:** **IPCC AR6 WGIII Ch.12** — CDR technology set, permanence tiers, and cost ranges.
**IEA CCUS** — DAC/BECCS cost trajectories and TRLs. **Wright's Law / experience-curve** theory —
explicitly used for the DAC cost decline. The gap vs the guide is the missing constrained optimiser
(specified in §8).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The portfolio builder is manual. Below is the
production NET-portfolio optimisation model.

### 8.1 Purpose & scope
Given a removal target (or budget) and constraints on permanence, scalability, and diversification, solve
for the cost-minimising (or removal-maximising) mix across CDR technologies with deployment-dependent
learning, for corporate CDR procurement and net-zero portfolio design.

### 8.2 Conceptual approach
A constrained linear/convex program over technologies with **experience-curve cost dynamics**, benchmarked
against **IEA NZE CDR pathways** and corporate CDR-portfolio practice (Frontier/Microsoft-style multi-
technology procurement). Permanence-weighted tonnes ensure durable removals are not undervalued.

### 8.3 Mathematical specification
Minimise `Σ_i c_i(q_i)·q_i` s.t. `Σ_i π_i·q_i ≥ Target` (π_i = permanence weight, e.g. durability-adjusted),
`q_i ≤ Scalability_i`, `TRL_i ≥ TRL_min`, `q_i ≥ 0`, plus optional diversification bounds
`q_i ≤ γ·Σq`. Cost with learning: `c_i(Q_i) = c₀_i·(Q_i/Q₀_i)^{−b_i}`, `b_i = −log₂(1−LR_i)`. Permanence
weight `π_i = min(1, durability_i / 1000 yr)` or a discount for reversal risk. Budget-constrained dual:
maximise `Σ π_i·q_i` s.t. `Σ c_i·q_i ≤ Budget`.

| Parameter | Source |
|---|---|
| c₀_i, cost trajectory | IEA CCUS, IPCC AR6 |
| Learning rate LR_i | Technology-specific (DAC ~15 %) |
| Scalability ceiling | IPCC AR6 sustainable-potential |
| Permanence/durability | IPCC AR6 storage-durability |
| Reversal risk | Buffer/insurance data |

### 8.4 Data requirements
Per-technology cost curves, scalability ceilings, durability, TRL, and (for learning) cumulative deployment.
Platform has the hand-authored NETS table as a calibration base.

### 8.5 Validation & benchmarking plan
Reconcile optimal mixes against IEA NZE CDR deployment shares and published corporate CDR portfolios;
sensitivity on learning rate and permanence weighting; verify LP optimality.

### 8.6 Limitations & model risk
Learning rates and long-run scalability are deeply uncertain; permanence weighting is a value judgement;
MRV quality varies sharply by technology. Conservative fallback: cap novel-technology allocation, weight by
durability, and require MRV-verified removals for compliance use.

## 9 · Future Evolution

### 9.1 Evolution A — Real portfolio optimiser replacing the manual allocator (analytics ladder: rung 1 → 5)

**What.** §7's partial mismatch: the guide promises a portfolio *optimiser* (`minimize Σ cost_i·qty_i s.t. Σqty_i ≥ target, permanence_i ≥ min`), but the "Portfolio Builder" is a manual allocation calculator — the user sets percentages, the page computes `removal_i = (spend_i/cost2030_i)·1000`. The underlying data is sound: six real NETs (DAC, BECCS, enhanced weathering, ocean alkalinity, biochar, soil carbon) with hand-authored realistic cost/permanence/scalability, and the DAC cost trajectory is a genuine Wright's-Law learning curve (`400·e^(−0.045·(yr−2024))`). Evolution A ships the actual constrained optimiser.

**How.** (1) Implement the LP the guide states: `scipy.optimize.linprog` (or `minimize` with constraints) minimising blended cost subject to a total-removal floor, a permanence-weighted-average floor, and per-technology scalability caps (MtCO₂/yr potential) — the roadmap names scipy optimisation as the rung-5 prescriptive tier, and NET portfolio construction is exactly a first-mover for it. (2) Feed the optimiser the DAC learning-curve cost at the chosen target year so the optimal mix shifts toward DAC as its cost falls over time — coupling the two features the page currently keeps separate. (3) Return the efficient frontier (cost vs permanence) so the user sees the trade-off, not one point.

**Prerequisites.** Cost/permanence/scalability figures should carry IPCC AR6 WGIII Ch.12 / IEA CCUS citations (named in §5) rather than bare hand-authoring; a pinned `bench_quant` case with a known LP optimum. **Acceptance:** the optimiser returns a provably minimum-cost mix meeting both constraints (verifiable against a hand-solved small case); raising the permanence floor shifts allocation away from soil carbon toward DAC/enhanced weathering as expected.

### 9.2 Evolution B — CDR procurement copilot with tool-called optimisation (LLM tier 2)

**What.** A copilot for a corporate CDR buyer: "build me a 100 ktCO₂ removal portfolio under $200/t average with at least 60% durable (>1000yr) removal", "how does the optimal DAC share change if I target 2035 instead of 2030?" — executed as calls to the Evolution-A optimiser and the DAC learning-curve model, presenting the recommended mix with per-technology rationale drawn from the real cost/permanence/scalability attributes.

**How.** Tool schema over the new `POST /net-portfolio/optimize` endpoint (constraints as typed parameters) and a cost-trajectory tool; system prompt from this Atlas page's §5 optimisation statement and the six-NET attribute table so the copilot explains permanence tiers (1yr soil carbon → 10,000yr enhanced weathering) correctly. The year-sensitivity question becomes a swept sequence of optimiser calls rendered as a trajectory. No-fabrication validator matches every tonne/cost/percentage to a tool response; the copilot must not assert removal permanence beyond the attributes the data encodes.

**Prerequisites (hard).** Evolution A — there is no optimiser to call today, and a copilot presenting the manual allocator's output as "optimal" would misrepresent it exactly as §7 warns. **Acceptance:** every recommended allocation traces to an optimiser call satisfying the stated constraints; asking for a NET not in the six-technology set yields a refusal listing what is modelled.