## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The guide's `CCI = Σ(Sector Shock_i × Contagion
> Matrix_ij)/N` implies the contagion matrix directly determines the headline systemic-risk score.
> In the code, the headline **SCRI** ("SCRI Score"/"SCRI Composite") is `gdpWeightedSRI`, a
> **GDP-weighted mean of each sector's independently `sr()`-seeded `systRiskIndex`** — the 20×20
> `NETWORK` contagion matrix is **not** used in that calculation. However, the module does implement
> a genuine, separate **breadth-first cascade-propagation algorithm** over the same `NETWORK` matrix
> (§7.3) and a real Monte Carlo tail-loss engine with VaR/ES statistics (§7.4) — both legitimate risk
> calculations, just not wired into the single "SCRI" headline figure the way the guide's formula
> implies. Treat SCRI as a composite exposure score and the cascade/MC outputs as complementary,
> currently-unreconciled risk views.

### 7.1 What the module computes

20 sectors (`SECTORS`), each independently `sr()`-seeded across 19 risk attributes: `gdpWeight`
(2–12%), `systRiskIndex` (20–95), `contagionScore`, `physRisk`/`transRisk` (10–90), `leverageRatio`
(1.0–8.0×), `sectorPD` (0.1–6.0%), `sectorLGD` (30–70%), `tippingProximity`, `carbonLockIn`, and
more. A 20×20 `NETWORK` contagion-intensity matrix (off-diagonal `sr()`-seeded 0–0.65, diagonal 1.0),
5 NGFS scenarios with `baseMult` multipliers (Orderly 1.0 → Hot House World 2.2), 25 central-bank
early-warning indicators across 8 risk domains (`CB_INDICATORS`), 7 macroprudential policy tools
(`MACRO_TOOLS`, e.g. CCyB, sectoral capital buffer, carbon tax, green supporting factor) each with
per-unit GDP/credit/risk-reduction sensitivities, and a 1,000-draw Monte Carlo systemic-loss
distribution.

### 7.2 Headline SCRI (GDP-weighted composite)

```js
gdpWeightedSRI = Σ_sectors (systRiskIndex × gdpWeight) / Σ_sectors gdpWeight
```

A standard GDP-weighted average, correctly guarded against `totalW <= 0`. Because `systRiskIndex` is
itself an independent random draw per sector rather than a function of `physRisk`, `transRisk`,
`leverageRatio`, etc., the headline SCRI does not actually aggregate the platform's own underlying
risk drivers — it re-weights one already-synthetic composite field by GDP share.

### 7.3 Network cascade propagation (genuine graph algorithm)

```js
cascadeChain: BFS over NETWORK from contagionSource
  layer[0] = [contagionSource]
  layer[d] = { j : NETWORK[src][j] >= contagionThresh, src ∈ layer[d-1], j unvisited }
  stop when a layer is empty or cascadeDepth reached
```

This is a genuine **threshold-gated breadth-first search** through the contagion network — sector
`j` is "infected" at depth `d` only if some sector already infected at depth `d−1` has a link
strength ≥ the user-set `contagionThresh`. `networkDensity` separately computes the % of off-diagonal
matrix entries exceeding 0.3 (a network-connectivity statistic). `contagionAffected` is the 1-hop
neighbour list from a single source sector, sorted by link intensity — a genuine adjacency-list
lookup, not random.

### 7.4 Monte Carlo systemic-loss engine (genuine tail statistics)

```js
MC_SYSTEMIC_LOSSES[i] = base + fatTail
  base    = 5 + sr(i×3+7)×40                          // uniform-ish body, [5,45]
  fatTail = sr(i×3+8) > 0.92 ? sr(i×3+9)×60 : 0        // 8% draw probability, [0,60] tail add-on

mean   = Σ losses / 1000
VaR95  = sorted[floor(1000×0.95)]                       // 95th percentile
ES99   = mean(sorted[floor(1000×0.99):])                 // tail-conditional mean beyond 99th pctile
P(Event>40) = count(losses>40) / 1000
```

This is a **legitimate fat-tailed mixture distribution** (a uniform-ish body plus an 8%-probability
tail shock, loosely mimicking a Poisson-jump/mixture severity model) with correctly implemented
order-statistic VaR and Expected Shortfall — VaR₉₅ as the 95th-percentile order statistic and ES₉₉ as
the mean of losses beyond the 99th percentile are both textbook-correct definitions, distinct from
(and more rigorous than) the flat-multiplier "EAL" seen in several sibling modules in this batch.

### 7.5 Macroprudential tool effectiveness

```js
delta          = userToolLevel − currentLevel
gdpImpact      = gdpImpactPerUnit × delta
creditImpact   = creditImpactPerUnit × delta
riskReduction  = riskReductionPerUnit × |delta|
totalRiskReduction = Σ_tools riskReduction
```

A linear per-unit sensitivity model — moving the Counter-Cyclical Capital Buffer (CCyB) by +1pp costs
`−0.08%` GDP and `−0.4%` credit growth while reducing systemic risk by `0.6` points (per-unit
coefficients are static, hand-calibrated, not derived from a macro model), consistent in direction
with real BCBS Basel III CCyB guidance (higher buffers dampen credit growth and GDP marginally while
building resilience).

### 7.6 Worked example

Sector 8 (`i=8`, 'Real Estate'): `systRiskIndex = 20+sr(8*11)*75 = 20+sr(88)*75`. Illustratively
suppose this evaluates to `systRiskIndex≈78`, matching the guide's own stated example ("Most Exposed
Sector: Real Estate"). With `gdpWeight≈0.02+sr(56)*0.10`, say `≈0.07` (7%), Real Estate contributes
`78×0.07=5.46` to the weighted numerator. If the sum of all 20 `systRiskIndex×gdpWeight` products is
`≈41.5` against `Σ gdpWeight≈0.75` (weights don't sum to 1 by construction — each drawn
independently in [0.02, 0.12]), `gdpWeightedSRI = 41.5/0.75 ≈ 55.3`. At `scenarioIdx=1` ('Disorderly',
`baseMult=1.4`): `scriTrend[2030] = 55.3×1.4×(1+1×0.04)+noise ≈ 55.3×1.4×1.04+noise ≈ 80.5+noise` —
the scenario multiplier and a 4%-per-period compounding term project the SCRI forward, again without
feeding through the cascade or Monte Carlo machinery.

### 7.7 Data provenance & limitations

- **All sector attributes, the contagion matrix, MC loss draws, and central-bank indicators are
  `sr()`-seeded synthetic data** — realistic ranges (e.g. PD 0.1–6%, LGD 30–70%) but not calibrated
  to any real balance-sheet or interbank-exposure dataset.
- The three major analytical engines on this page — GDP-weighted SCRI, network cascade BFS, and
  Monte Carlo VaR/ES — are **not reconciled with each other**: a user can set `contagionThresh` low
  enough to cascade the entire network without any corresponding change in `gdpWeightedSRI`, and
  `mcStats.probEvent` does not feed back into the SCRI trend projection.
- Macroprudential tool sensitivities are static, expert-judgment-style coefficients, not
  econometrically estimated.

**Framework alignment:** BIS CGFS (2021) and NGFS Systemic Risk Report (2023) are the guide's cited
sources for the contagion-index concept; the module's cascade-BFS and network-density calculations
are methodologically consistent with the network-based systemic-risk literature those bodies draw
on (e.g. DebtRank-style threshold propagation), even though the headline SCRI does not itself use the
network. NGFS's 5 scenario archetypes (Orderly/Disorderly/Hot House World/Below 2°C/Nationally
Determined) are correctly named and ordered by severity (`baseMult` increasing with scenario
disorderliness, Hot House World highest at 2.2×), matching NGFS's own severity ranking.
