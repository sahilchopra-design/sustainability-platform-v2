## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The guide describes a Contagion Propagation Score
> `CPSᵢ = Σⱼ wᵢⱼ · Materialityⱼ · Exposureᵢⱼ` over a 2,340-node supply-chain graph. The **backend engine
> (`dme_contagion_engine.py`) actually implements a rigorous multi-layer Hawkes-process model** —
> arguably *more* sophisticated than the guide's linear CPS — while the **frontend page renders a
> 40-entity network whose centrality metrics, SIR cascade and losses are entirely `sr()`-seeded
> synthetic numbers** that do *not* call the engine. So two different methodologies coexist: a real
> Hawkes engine (§7.1) and a demo SIR/centrality display (§7.3). Neither is the guide's CPS. The
> 2,340-node graph does not exist in code.

### 7.1 What the backend engine computes (the real model)

`ContagionEngine` is a **stateless three-layer self-exciting (Hawkes) intensity model**. Conditional
intensity λ(t) = baseline μ + Σ excitation from past events, decayed by a kernel:

**Edge weight** (counterparty coupling) — three channels blended:
```
w_fin = 0.7·(EAD/portfolio)·(1 + 0.3·HHI)
w_sc  = revenue_share·(1 − substitutability)
w_reg = 0.5·jurisdiction_overlap + 0.5·gics_similarity
composite = 0.45·w_fin + 0.35·w_sc + 0.20·w_reg          (CHANNEL_WEIGHTS)
```

**Layer 1 — entity-to-entity (daily), exponential kernel:**
```
λ₁ = μ + Σ_events  edge_w · severity · exp(−β·Δt_days)          (μ=0.05, β=0.5)
```
**Layer 2 — structural cascade (monthly), acute exponential + chronic power-law:**
```
acute events → α·exp(−β·Δt_months)                 (α=0.6, β=0.15)
other events → C·(Δt_months + τ)^(−(1+γ))          (power-law, γ=0.5)
```
**Layer 3 — capital flight (weekly), cross-sector herding:**
```
λ₃ = μ + Σ_sectors Σ_events  α_kj · exp(−β·Δt_weeks) · mag      (μ=0.03, β=0.3)
```
where `α_kj` is a cross-sector coupling (e.g. Energy→Energy 0.35, Financials→Financials 0.40).

**Aggregation** normalises L2/L3 to a daily base and weights the layers, then applies amplifiers:
```
agg = 0.40·λ₁ + 0.35·(λ₂/21) + 0.25·(λ₃/5)
base_amp = 1 + (agg/μ_baseline − 1)
EL/VaR/ES amplification = (1+contagion_ratio) × cross-pillar factor
```

**Stability** is checked by the **spectral radius of the branching matrix** `W/β`:
`is_stable = ρ(W/β) < 1` — the classic Hawkes stationarity condition. `simulate()` propagates a seed
shock through the adjacency matrix for N steps, logging entities-affected and total intensity.

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance (code) |
|---|---|---|
| Channel weights | fin 0.45 / sc 0.35 / reg 0.20 | `CHANNEL_WEIGHTS` — heuristic |
| Layer weights | L1 0.40 / L2 0.35 / L3 0.25 | `aggregate()` default |
| Cross-pillar amplifiers | G→E 2.5, X→EL 4.3, X→VaR 4.5, X→ES 3.2, S→P 2.3 | `CROSS_PILLAR_AMP` |
| Empirical targets | EL ×4.3, VaR ×4.5, ES ×3.2 (±10%) | engine docstring "empirical targets" |
| L1 kernel | μ=0.05, β=0.5 | Hawkes decay |
| L2 kernel | α=0.6, β=0.15, γ=0.5 | acute vs chronic split |
| L3 kernel | μ=0.03, β=0.3 | weekly herding |

The amplifier magnitudes (4.3/4.5/3.2) are described as *empirical targets* but no calibration dataset
is bundled — treat them as **assumed** until backtested.

### 7.3 Frontend display (synthetic, does not call the engine)

The page builds 40 entities across 8 sectors × 5 regions, each with **`sr()`-seeded** graph metrics:
`degreeCentrality = sr(i·11)·0.85+0.1`, `betweenness = sr(i·13)·0.7+0.05`, `closeness`, `eigenvector`.
A composite **systemic score** and G-SIB/D-SIB tiering are then derived:
```
systemicScore = (0.30·degree + 0.35·betweenness + 0.35·eigenvector) × 100
tier = >55 G-SIB | >35 D-SIB | >20 Significant | else Standard
capitalSurcharge % = 0.04·systemicScore + 1
cascadeLoss = exposureB · stressedPD · leverageRatio · 0.4
```
The **cascade** is a discrete **SIR epidemic** (not Hawkes): `β=0.28` infection, `γ=0.09` recovery,
seeded at the highest-eigenvector hub, over 20 steps, with `sr()` noise added to new infections.

### 7.4 Worked example (frontend systemic score & SIR step)

Entity i=5 (JPMorgan): `degree = sr(55)·0.85+0.1`, `betweenness = sr(65)·0.7+0.05`,
`eigenvector = sr(95)·0.9+0.05`. Suppose these resolve to 0.62 / 0.40 / 0.55.
```
systemicScore = (0.30·0.62 + 0.35·0.40 + 0.35·0.55)×100 = (0.186+0.140+0.1925)×100 = 51.85
tier = 51.85 > 35 → D-SIB      capitalSurcharge = 0.04·51.85 + 1 = 3.07%
```
SIR step 1 with N=40, S=39, I=1: `newInfected = round(0.28·39·1/40 + sr(17)·2)`. With β·S·I/N = 0.273
and sr(17)≈0.97·2 ≈ 1.9 → newInfected ≈ round(2.17) = 2; `newRecovered = round(0.09·1)=0`. So I→3, S→37.

### 7.5 Companion analytics

Centrality radar (top 8), sectoral 8×8 exposure matrix, critical-path (top-8 by eigenvector), historical
events (16 rows, e.g. GFC/COVID) with a `networkSim` field, 5 shock scenarios (target/infected/
timeToPeak/lossB), early-warning z-scores (`|z|>2 ALERT`), and a G-SIB→Standard capital-buffer roll-up.
The route file exposes 8 endpoints (`/edge-weight`, `/l1-…/l2-…/l3-intensity`, `/aggregate`,
`/simulate`, `/stability-check`) — these hit the real engine but the page's headline tiles do not.

### 7.6 Data provenance & limitations

- **Frontend: 100% synthetic.** All 40-entity metrics come from `sr(seed)=frac(sin(seed+1)×10⁴)`; the
  SIR cascade adds further `sr()` noise. Company names are real but their numbers are fabricated.
- **Backend: real maths, unproven calibration.** Kernels and stability check are textbook Hawkes; the
  amplifier constants (4.3/4.5/3.2) are asserted "empirical targets" with no bundled backtest.
- SIR ≠ Hawkes: the page's headline cascade uses a compartmental epidemic model, structurally different
  from the engine it nominally sits above — a reader should not conflate the two.

**Framework alignment:** **Hawkes self-exciting point processes** (Bacry-Muzy-style financial
contagion), **NGFS network-analysis** and **ECB economy-wide climate stress-test** contagion channels
(financial/supply-chain/regulatory), **FSB** systemic-risk / G-SIB designation logic (the frontend's
systemic-score → G-SIB/D-SIB tiering mirrors the BCBS G-SIB indicator approach, where BCBS actually
scores size, interconnectedness, substitutability, complexity and cross-jurisdictional activity — here
collapsed into three centrality proxies).

---

## 8 · Model Specification

**Status: specification — not yet implemented in code (frontend display).**

### 8.1 Purpose & scope
Give the frontend a *real* systemic-importance and cascade view driven by the backend Hawkes engine,
replacing the `sr()`-seeded centrality/SIR demo. Scope: the covered issuer/counterparty network.

### 8.2 Conceptual approach
Two-part: (a) a **DebtRank / eigenvector-based systemic-importance score** on the real exposure graph
(Battiston et al. DebtRank; ECB SYMBOL) and (b) the existing **multi-layer Hawkes intensity** for
dynamic contagion. Benchmarks: **ECB economy-wide climate stress test** network module, **NGFS** network
analysis, **FSB/BCBS G-SIB** indicator methodology, Battiston DebtRank.

### 8.3 Mathematical specification
```
Systemic importance (DebtRank):
  h_i(t+1) = min(1, h_i(t) + Σ_j W_ji · h_j(t) · (state_j = distressed))
  R_DebtRank = Σ_i v_i · (h_i(T) − h_i(0)) ,   v_i = economic value weight
Dynamic contagion: keep engine λ = μ + Σ kernel·excitation (Layers 1–3)
Systemic score = z-normalise(R_DebtRank) → percentile → G-SIB/D-SIB tier
Capital surcharge %: map bucketed score to BCBS G-SIB buffer (1.0–3.5%)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Bilateral exposures | `W_ji` | EAD/portfolio (existing engine EdgeWeightInput) |
| Value weights | `v_i` | market cap / total assets |
| Hawkes kernels | μ, β, α, γ | MLE on historical shock-clustering (event log) |
| Buffer buckets | — | BCBS G-SIB framework (2018) |

### 8.4 Data requirements
Bilateral exposure matrix (EAD, revenue share, jurisdiction/GICS overlap — already in `EdgeWeightInput`),
event log with timestamps/severity for kernel MLE, market-value weights. Free sources: BIS
cross-border banking statistics, FSB G-SIB list; vendor: supply-chain graph (Bloomberg SPLC).

### 8.5 Validation & benchmarking plan
Reconcile DebtRank ordering against the published FSB G-SIB bucket list (rank correlation). Backtest
Hawkes kernels by out-of-sample event-clustering likelihood. Confirm `ρ(W/β)<1` stationarity on the
real matrix; stress it toward instability to verify the check fires.

### 8.6 Limitations & model risk
DebtRank assumes exposures are known and static; real networks are partially observed. Hawkes kernel
MLE needs a long, clean event history the platform does not yet hold. Conservative fallback: absent a
calibrated kernel, cap amplifiers at 1.0 (no amplification) rather than the unvalidated 4.x factors.
