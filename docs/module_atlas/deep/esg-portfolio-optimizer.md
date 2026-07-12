## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The title and guide promise **ESG-constrained portfolio
> optimisation** (mean-variance with ESG/carbon/Paris constraints, current→optimised reallocation).
> **No optimiser runs.** The page fabricates 50 pre-built "portfolios", each carrying *both* a `weight`
> and an `optWeight`, and *both* a `carbonInt` and an `optCarbonInt` — but the "optimised" figures are
> **independent `sr()` draws**, not the output of any solver. The "efficient frontier" chart is a
> scatter of the synthetic (vol, return) pairs, not a computed frontier. What the module genuinely
> does is filter/sort/aggregate a synthetic portfolio table and render current-vs-"optimised"
> comparisons. §8 specifies the real optimiser.

### 7.1 What the module computes

Only descriptive aggregation over the synthetic table is real:

```js
kpis: avgSharpe/avgEsg/avgReturn/avgVol/avgCarbon = mean over filtered set
sectorAlloc: Σ weight and Σ optWeight per sector
radarData: mean(esgScore/env/soc/gov/greenRev); "Carbon Eff" = 100 − avgCarbon/5
trendData: mean of q1..q4 (synthetic quarterly Sharpe)
```

Each portfolio's fields are seeded (`s(idx)=sr(i*idx+idx)`):

```js
esgScore    = floor(25 + s(31)*70)         // 25–95
weight      = 0.5 + s(37)*4.5              // 0.5–5.0 %   ("current")
optWeight   = 0.3 + s(41)*4.7              // 0.3–5.0 %   ("optimised" — SEPARATE draw)
expReturn   = 2 + s(43)*14                 // 2–16 %
vol         = 5 + s(47)*20                 // 5–25 %
sharpe      = 0.2 + s(53)*2.3              // 0.2–2.5     (independent, NOT return/vol)
carbonInt   = floor(10 + s(61)*490)        // "current"
optCarbonInt= floor(5  + s(67)*300)        // "optimised" — SEPARATE draw
tempAlign   = 1.2 + s(71)*2.3              // 1.2–3.5 °C
```

Crucially, `sharpe` is drawn independently of `expReturn`/`vol` — it is *not* `(return−rf)/vol` — and
`optWeight`/`optCarbonInt` bear no optimisation relationship to their "current" counterparts.

### 7.2 Parameterisation

| Element | Source |
|---|---|
| 50 portfolio names | curated label list ("Paris Aligned Core", "SFDR Art 9 Optimal", …) |
| `CONSTRAINTS` (8) | curated labels: Min ESG 60, Max Carbon 200, Paris Aligned, Net Zero, Exclusion List, Best-in-Class, SDG Aligned, SFDR Art 8 |
| All numeric fields | synthetic `sr()` draws |
| "Optimised" weight/carbon | independent `sr()` draws (not solver output) |

The constraint labels are realistic ESG-mandate types, but they are assigned randomly to portfolios
and **do not gate** any of the numbers (a "Min ESG 60" portfolio can carry a drawn ESG of 25).

### 7.3 Calculation walkthrough

1. `genData(50)` fabricates the portfolio table.
2. Filter by search/constraint/sector; sort by any column; paginate (12/page).
3. Overview: constraint distribution pie, current-vs-opt sector allocation bars, (vol,return) scatter
   labelled "efficient frontier".
4. Constraint tab: ESG radar, current-vs-opt carbon bars grouped by constraint.
5. Attribution tab: E/S/G by constraint, green-revenue distribution.
6. Frontier tab: synthetic quarterly Sharpe trend, alpha-vs-drawdown scatter.

### 7.4 Worked example — the "optimisation" illusion

Portfolio i with `s(37)=0.6 → weight = 0.5+0.6×4.5 = 3.2%` and `s(41)=0.3 → optWeight =
0.3+0.3×4.7 = 1.71%`. The UI shows "Current 3.2% → Optimised 1.71% (reduce)", implying the optimiser
trimmed the position — but `optWeight` came from `sr(i*41+41)`, entirely unrelated to `weight`. Same
for carbon: `carbonInt = 10+s(61)*490` vs `optCarbonInt = 5+s(67)*300` are independent, so "optimised
carbon" is *usually* lower only because its range ceiling (305) is below the current ceiling (500) —
a range artefact, not an optimisation.

### 7.5 Data provenance & limitations

- **Fully synthetic** (`sr(s)=frac(sin(s+1)×10⁴)`); no covariance matrix, no objective function, no
  solver. "Optimised" columns are independent draws.
- `sharpe` is not consistent with the shown `expReturn`/`vol` (independent draw).
- Constraints are labels only; they neither filter the universe nor bind the numbers.
- The "efficient frontier" is a point cloud, not a computed frontier (no upper envelope, no
  risk-return trade-off curve).

**Framework alignment:** the guide/constraints reference **SFDR Art 8/9**, **EU Taxonomy**,
**Paris alignment**, **SBTi** and **Net Zero** — real ESG-mandate constraint types. A genuine
implementation would embed these as linear constraints in a mean-variance/CVaR optimiser (min ESG,
max carbon intensity, exclusion sets, taxonomy-alignment floor). None is implemented.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Construct ESG-constrained portfolios that maximise risk-adjusted return
subject to ESG score floors, carbon-intensity ceilings, exclusion lists and tracking-error budgets,
for SFDR Art 8/9 and net-zero-aligned mandates.

**8.2 Conceptual approach.** **Mean-variance optimisation** (Markowitz) with linear ESG constraints and
a tracking-error limit, or **robust/CVaR** variants — mirroring BlackRock Aladdin ESG optimisation and
Barra Open Optimizer. Carbon-decarbonisation-path constraints per CRREM/SBTi.

**8.3 Mathematical specification.** Decision vector `w` (weights):
- Objective: `max_w  w'μ − (λ/2)·w'Σw` (or `min CVaR_α(−w'r)`), `μ` expected returns, `Σ` covariance.
- Budget: `Σ w_i = 1`, `w_i ≥ 0` (long-only) or box bounds.
- ESG floor: `w'e ≥ E_min` (`e` = security ESG scores).
- Carbon ceiling: `w'c ≤ C_max` (`c` = carbon intensity tCO₂e/$M).
- Paris/decarbonisation: `w'c ≤ C_0·(1 − r)^{t}` (annual reduction rate r, CRREM/SBTi path).
- Exclusions: `w_j = 0 ∀ j ∈ X`; Taxonomy floor: `w'a ≥ A_min`.
- Tracking error: `(w − w_b)'Σ(w − w_b) ≤ TE_max²`.

| Parameter | Source |
|---|---|
| μ, Σ | factor model / historical (Barra/FactSet) |
| ESG scores e | MSCI / Sustainalytics |
| Carbon c | PCAF financed-emissions / Trucost |
| Decarbonisation r, path | SBTi sector / CRREM 1.5°C |
| λ, TE_max | mandate risk budget |

**8.4 Data requirements.** Security-level expected returns, covariance, ESG scores, carbon intensity,
taxonomy alignment, exclusion list, benchmark weights. None present.

**8.5 Validation & benchmarking plan.** Verify constraints bind at optimum (KKT); frontier convexity;
reconcile against Aladdin/Barra optimiser on the same inputs; out-of-sample TE realised vs budget.

**8.6 Limitations & model risk.** μ estimation error dominates MV solutions (→ robust/Black-Litterman);
Σ instability; ESG-carbon constraints can force concentration; corner solutions sensitive to bounds.
