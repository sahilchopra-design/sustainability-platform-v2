# Geopolitical Risk Index
**Module ID:** `geopolitical-risk-index` · **Route:** `/geopolitical-risk-index` · **Tier:** B (frontend-computed) · **EP code:** EP-CV1 · **Sprint:** CV

## 1 · Overview
50 countries with WGI 6 dimensions, sanctions exposure, conflict intensity, and custom weights.

**How an analyst works this module:**
- Global Map shows 50 countries color-coded
- Country Rankings sorted by composite score
- Custom Weights allow dimension adjustment

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `DIMS`, `REGIONS`, `TABS`, `WEIGHTS_DEFAULT`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRIES` | 51 | `region`, `va`, `ps`, `ge`, `rq`, `rl`, `cc`, `sanctions`, `conflict`, `trade`, `trend` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America','Western Europe','Eastern Europe','Middle East','Sub-Saharan Africa','North Africa','South Asia','East Asia','Southeast Asia','Central Asia','Latin America','Oceania'];` |
| `totalW` | `Object.values(w).reduce((s, v) => s + v, 0);` |
| `govScore` | `(c.va * w.va + c.ps * w.ps + c.ge * w.ge + c.rq * w.rq + c.rl * w.rl + c.cc * w.cc) / (w.va + w.ps + w.ge + w.rq + w.rl + w.cc);` |
| `riskPenalty` | `(c.sanctions * w.sanctions + c.conflict * w.conflict + c.trade * w.trade) / (w.sanctions + w.conflict + w.trade);` |
| `TABS` | `['Global Risk Map','Country Rankings','6-Dimension Analysis','Trend & Forecast','Custom Weights','Regional Deep-Dive'];` |
| `scored` | `useMemo(() => COUNTRIES.map(c => ({ ...c, composite: computeScore(c, weights) })).sort((a, b) => b.composite - a.composite), [weights] );` |
| `regionData` | `REGIONS.map(r => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `DIMS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries | — | WGI | Covering 85% of global GDP |
| WGI Dimensions | — | World Bank | Annual governance indicators |

## 5 · Intermediate Transformation Logic
**Methodology:** Composite geopolitical scoring
**Headline formula:** `GeoRisk = Σ(dimension_i × weight_i)`

6 WGI dimensions: Voice & Accountability, Political Stability, Government Effectiveness, Regulatory Quality, Rule of Law, Control of Corruption. Plus: sanctions, conflict, trade policy risk.

**Standards:** ['World Bank WGI', 'EIU', 'V-Dem']
**Reference documents:** World Bank WGI; EIU Democracy Index; V-Dem Institute

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Live WGI ingestion with percentile confidence bands and calibrated weights (analytics ladder: rung 2 → 3)

**What.** §7 rates CV1 one of the more faithful CV-sprint implementations: a genuine weighted-mean composite `round(govScore·0.7 + (100−riskPenalty)·0.3)` over the six WGI dimensions plus sanctions/conflict/trade penalties, with user-adjustable weights. Its flagged gaps: all 51 country rows are static synthetic demo values (not live WGI/OFAC/ACLED pulls despite the citation), `trend[]` is a 5-point hand-set series, the 0.7/0.3 split is hard-coded rather than empirically calibrated, and WGI's real percentile-rank confidence intervals are collapsed to point estimates. Evolution A makes the index real: ingest live WGI (World Bank publishes it via API), carry the percentile confidence bands WGI provides, back sanctions/conflict penalties with OFAC/ACLED feeds, and calibrate the governance-vs-risk split against sovereign spread/default outcomes.

**How.** (1) A WGI ingester writing the six dimensions with their published standard errors to a `wgi_scores` table; the composite carries a confidence band. (2) Sanctions penalty from OFAC SDN breadth, conflict from ACLED event intensity — real feeds replacing the static scalars. (3) Calibrate the 0.7/0.3 weight (and optionally the penalty decomposition into primary/secondary sanctions, inter/intrastate conflict) against a sovereign-spread panel, documented per §8.

**Prerequisites.** WGI/OFAC/ACLED ingesters; a sovereign-spread reference series for calibration; the static country table retired. **Acceptance:** the index reproduces live WGI within tolerance and shows confidence bands; the calibrated split is documented with its fit; no static literal drives a country score.

### 9.2 Evolution B — Country-risk analyst copilot (LLM tier 2)

**What.** A copilot for sovereign and country-risk desks: "rank our exposure countries by geopolitical risk if I weight rule-of-law double, and explain what drives Nigeria's score" tool-calls the CV1 scoring endpoint with custom weights and narrates the six-dimension decomposition, sanctions/conflict penalties, and trend from real WGI data.

**How.** Tier-2 tool-calling over the (Evolution A) scoring endpoint with the weight vector as a tool parameter — the module's custom-weights feature becomes a natural tool surface. The grounding corpus is §5/§7, which accurately describe WGI's unobserved-components construction, so the copilot explains what each dimension measures and why a country scores as it does. Because the composite is already a genuine weighted mean, a tier-1 explainer over rendered rankings ships before the ingestion work. Every score validated against tool output; confidence bands surfaced honestly post-Evolution-A.

**Prerequisites.** Evolution A for live data and bands (custom-weight what-ifs work on the current static table for tier 1); corpus embedding. **Acceptance:** re-weighted rankings in a copilot answer match the scoring endpoint for the given weights; the copilot reports WGI confidence intervals post-Evolution-A rather than presenting scores as exact.