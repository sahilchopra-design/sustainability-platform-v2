## 7 · Methodology Deep Dive

The Geopolitical Risk Index (EP-CV1) scores 50 countries on a composite of the six World Bank
Worldwide Governance Indicator (WGI) dimensions plus three risk penalties (sanctions, conflict,
trade), with user-adjustable weights. This is one of the more faithful implementations in the CV
sprint — the maths is a genuine weighted mean, though the underlying country scores are static seed
values rather than live WGI pulls.

### 7.1 What the module computes

```js
function computeScore(c, w) {
  const govScore = (c.va*w.va + c.ps*w.ps + c.ge*w.ge + c.rq*w.rq + c.rl*w.rl + c.cc*w.cc)
                 / (w.va + w.ps + w.ge + w.rq + w.rl + w.cc);         // governance mean
  const riskPenalty = (c.sanctions*w.sanctions + c.conflict*w.conflict + c.trade*w.trade)
                    / (w.sanctions + w.conflict + w.trade);           // risk mean
  return Math.round(govScore * 0.7 + (100 - riskPenalty) * 0.3);
}
```

The composite is a **70/30 blend**: 70% weight on the six-dimension governance mean, 30% on the
inverse of a sanctions/conflict/trade risk mean. Both sub-scores are weight-normalised (divide by
their own weight sum), so the two blocks are independently scaled before the fixed 0.7/0.3 mix.
Higher composite = lower geopolitical risk (score is a stability index, not a risk index).

### 7.2 Weighting rubric (WGI 6 + 3 risk penalties)

Default `WEIGHTS_DEFAULT` (JSX line 73):

| Dimension | Code | Default weight | WGI meaning |
|---|---|---|---|
| Voice & Accountability | `va` | 12 | Citizen participation, free media |
| Political Stability | `ps` | **20** | Absence of violence/terrorism (heaviest) |
| Govt Effectiveness | `ge` | 12 | Public-service quality, policy credibility |
| Regulatory Quality | `rq` | 12 | Sound market-friendly regulation |
| Rule of Law | `rl` | 12 | Contract enforcement, property rights |
| Control of Corruption | `cc` | 12 | Public power not used for private gain |
| Sanctions | `sanctions` | 8 | OFAC/EU designation intensity (penalty) |
| Conflict | `conflict` | 8 | ACLED-style conflict intensity (penalty) |
| Trade policy | `trade` | 4 | Trade-restriction / weaponisation risk (penalty) |

Political Stability is over-weighted (20 vs 12) — an editorial choice reflecting that acute
instability dominates near-term sovereign risk. All weights are user-adjustable via the Custom
Weights tab; the normalisation means only *relative* weights matter within each block.

Country scores (`va…cc` on 0–100, `sanctions/conflict/trade` as 0–48 penalties, `trend[5]` history)
are static literals for 51 rows (guide says 50). No `sr()` PRNG.

### 7.3 Calculation walkthrough

1. Weights → `computeScore` for every country → sort descending by composite.
2. KPI cards: countries covered, highest-risk (`scored[last]`), lowest-risk (`scored[0]`), average.
3. Region filter subsets the sorted list for the Regional Deep-Dive.
4. `regionData` aggregates mean composite per region for the 6-dimension radar / regional view.

### 7.4 Worked example (Russia, default weights)

Russia: `va=8, ps=15, ge=42, rq=28, rl=22, cc=18`, `sanctions=45, conflict=40, trade=45`.

| Step | Computation | Result |
|---|---|---|
| Gov numerator | 8·12+15·20+42·12+28·12+22·12+18·12 | 96+300+504+336+264+216 = 1716 |
| Gov weight sum | 12+20+12+12+12+12 | 80 |
| govScore | 1716 / 80 | **21.45** |
| Risk numerator | 45·8+40·8+45·4 | 360+320+180 = 860 |
| Risk weight sum | 8+8+4 | 20 |
| riskPenalty | 860 / 20 | **43.0** |
| Composite | round(21.45·0.7 + (100−43.0)·0.3) | round(15.02 + 17.1) = **32** |

Russia scores 32 — bottom quartile, driven by the low governance mean; the risk penalty (43) shaves
a further 17-point stability credit relative to a clean country (which would contribute the full 30).

### 7.5 Data provenance & limitations

- **All 51 country rows are static synthetic demo values**, not live WGI/OFAC/ACLED pulls despite
  the "Source: World Bank WGI 2024 | OFAC | ACLED | WTO" citation. `trend[]` is a 5-point hand-set
  series, not a real time series.
- The 0.7/0.3 governance-vs-risk split is hard-coded, not empirically calibrated to sovereign
  default/spread outcomes.
- WGI in reality is published as percentile ranks with confidence intervals; this module treats the
  scores as point estimates with no uncertainty band.
- Sanctions/conflict/trade penalties are single scalars, not decomposed by regime (primary vs
  secondary sanctions, interstate vs intrastate conflict).

**Framework alignment:** *World Bank WGI* — the six-dimension mean directly mirrors WGI's six
aggregate indicators; WGI itself is built by an *unobserved-components model* that rescales and
precision-weights ~30 underlying data sources into a standard-normal then 0–100 percentile scale.
*OFAC/EU sanctions* — the sanctions penalty proxies designation breadth. *ACLED* — the conflict
penalty proxies event-count intensity. *EIU / V-Dem* (cited) — comparable composite-governance
methodologies the index is meant to echo.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Country scores are static literals and the
0.7/0.3 blend is unvalidated, so a production sovereign-risk model is specified below.

**8.1 Purpose & scope.** Produce a defensible, back-testable sovereign geopolitical-risk score for
50–100 countries feeding sovereign bond, quasi-sovereign, and country-limit decisions.

**8.2 Conceptual approach.** Live WGI unobserved-components aggregation for the governance block,
plus an event-driven risk block, combined by an *empirically calibrated* weight rather than a fixed
0.7/0.3. Benchmarks: **World Bank WGI** methodology (Kaufmann–Kraay UCM), **EIU Country Risk
Model**, and **Verisk Maplecroft** political-risk indices. Sanctions intensity mirrors **OFAC SDN**
network centrality; conflict mirrors **ACLED**/**UCDP** fatality-weighted event counts.

**8.3 Mathematical specification.**

```
WGI_{c,k} = UCM aggregate of source signals s (precision-weighted)     (k=6 dims)
Gov_c   = Σ_k β_k · WGI_{c,k}                                          (β from PC1 or spread-reg)
Risk_c  = γ_s·SanctIntensity_c + γ_f·ConflictFatalities_c + γ_t·TradeRestrict_c
Score_c = 100·Φ( θ·z(Gov_c) − (1−θ)·z(Risk_c) )                        (θ calibrated)
```

| Parameter | Calibration source |
|---|---|
| β_k | First principal component of WGI dims, or regression on sovereign CDS |
| γ_s | OFAC SDN designation count × secondary-sanction dummy |
| γ_f | ACLED/UCDP fatalities per capita (log) |
| γ_t | Global Trade Alert restrictive-measure count |
| θ | fitted on 5y sovereign spread panel (start 0.7) |

**8.4 Data requirements.** WGI six dimensions + confidence intervals (World Bank, free, annual);
OFAC SDN list (free); ACLED/UCDP conflict events (free/academic); Global Trade Alert (free); IMF
spreads/CDS (vendor). Platform NGFS tables and `reference_data` provide macro overlays.

**8.5 Validation & benchmarking.** Rank-correlate Score_c against EIU and Verisk indices (target
Spearman > 0.8); backtest against realised sovereign downgrades and CDS widening; sensitivity-test
θ and γ. Publish confidence bands as WGI does.

**8.6 Limitations & model risk.** WGI is annual and ~2y lagged — supplement with high-frequency
ACLED for acute shocks; UCM assumes conditional independence of sources; frontier-market data gaps
force wider CIs and a data-quality flag.
