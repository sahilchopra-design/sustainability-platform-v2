# DME Index
**Module ID:** `dme-index` · **Route:** `/dme-index` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Sector-level ESG materiality indices derived from Dynamic Materiality Engine scores aggregated across all entities in each GICS sector. Indices track materiality momentum over time, enabling macro-level sustainability trend analysis and sector rotation signals for ESG investors. Custom index construction is supported.

> **Business value:** Enables ESG investors and risk managers to track aggregate materiality risk at the sector level, supporting top-down portfolio positioning and monitoring of systemic ESG trends across capital markets.

**How an analyst works this module:**
- Select sectors and time horizon for index display in the index configuration panel
- Review the sector index heat map and identify sectors with rising materiality momentum
- Drill into individual sector indices to see contributing topics and top-scoring entities
- Export index time series for use in quantitative ESG factor models or sector allocation frameworks

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `ALERT_TIERS`, `DEFAULT_WEIGHTS`, `ENTITIES`, `ESG_W`, `FR_W`, `KpiGrid`, `PORT_TREND`, `REGIMES`, `SECTORS`, `TABS`, `TRANS_MATRIX`, `TabAlerts`, `TabBenchmark`, `TabComputation`, `TabESGComponent`, `TabFRComponent`, `TabHHI`, `TabHistory`, `TabOverview`, `TabRegime`, `TabVelocity`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TABS` | 11 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hhi` | `(weights) => weights.reduce((s, w) => s + w * w, 0);` |
| `frVar` | `+(20 + sr(i * 3) * 75).toFixed(1);` |
| `frPd` | `+(15 + sr(i * 7) * 80).toFixed(1);` |
| `frWacc` | `+(25 + sr(i * 11) * 70).toFixed(1);` |
| `frLiq` | `+(10 + sr(i * 13) * 85).toFixed(1);` |
| `frScore` | `+(frVar * FR_W.var + frPd * FR_W.pd + frWacc * FR_W.wacc + frLiq * FR_W.liq).toFixed(2);` |
| `esgGov` | `+(20 + sr(i * 17) * 75).toFixed(1);` |
| `esgEnv` | `+(15 + sr(i * 19) * 80).toFixed(1);` |
| `esgSoc` | `+(25 + sr(i * 23) * 70).toFixed(1);` |
| `esgReg` | `+(10 + sr(i * 29) * 85).toFixed(1);` |
| `esgScore` | `+(esgGov * ESG_W.gov + esgEnv * ESG_W.env + esgSoc * ESG_W.soc + esgReg * ESG_W.reg).toFixed(2);` |
| `velScore` | `+(50 + (velHistory[velHistory.length - 1] \|\| 0) * 200).toFixed(2); // normalised 0-100 proxy` |
| `dmi` | `+(frScore * DEFAULT_WEIGHTS.fr + esgScore * DEFAULT_WEIGHTS.esg + Math.max(0, Math.min(100, velScore)) * DEFAULT_WEIGHTS.vel).toFixed(2);` |
| `emaLast` | `emaHistory[emaHistory.length - 1];` |
| `ema4ago` | `emaHistory[emaHistory.length - 5] \|\| emaLast;` |
| `vel4q` | `+((emaLast - ema4ago) / Math.max(0.0001, Math.abs(ema4ago))).toFixed(4);` |
| `vel8q` | `+((emaLast - (emaHistory[emaHistory.length - 9] \|\| emaLast)) / Math.max(0.0001, Math.abs(emaHistory[emaHistory.length - 9] \|\| emaLast))).toFixed(4);` |
| `accel` | `+((vel4q - vel8q) / 4).toFixed(5);` |
| `msciLike` | `+(30 + sr(i * 37) * 65).toFixed(1);` |
| `sustLike` | `+(25 + sr(i * 41) * 70).toFixed(1);` |
| `issLike` | `+(20 + sr(i * 43) * 75).toFixed(1);` |
| `weight` | `+(0.015 + sr(i * 47) * 0.035).toFixed(4);` |
| `wSum` | `ENTITIES.reduce((s, e) => s + e.weight, 0);` |
| `wNorm` | `ENTITIES.map(e => e.weight / Math.max(0.0001, wSum));` |
| `portDMI` | `+(ENTITIES.reduce((s, e, i) => s + e.dmi * wNorm[i], 0)).toFixed(2);` |
| `effN` | `+(1 / Math.max(0.0001, portHHI)).toFixed(1);` |
| `TRANS_MATRIX` | `REGIMES.map((from, fi) =>` |
| `avg` | `+(ENTITIES.reduce((s, e, i) => s + (e.emaHistory[q] \|\| e.dmi) * wNorm[i], 0)).toFixed(2);` |
| `top5` | `[...ENTITIES].sort((a, b) => b.dmi - a.dmi).slice(0, 5);` |
| `bot5` | `[...ENTITIES].sort((a, b) => a.dmi - b.dmi).slice(0, 5);` |
| `regDist` | `REGIMES.map(r => ({ regime: r, count: ENTITIES.filter(e => e.regime === r).length }));` |
| `velW` | `100 - frW - esgW;` |
| `customDMI` | `ENTITIES.map(e => ({` |
| `frData` | `[...ENTITIES].sort((a, b) => b.frScore - a.frScore).slice(0, 20).map(e => ({` |
| `heatData` | `SECTORS.map(s => {` |
| `velData` | `e.emaHistory.map((v, i) => ({` |
| `top5Rising` | `[...ENTITIES].sort((a, b) => b.vel4q - a.vel4q).slice(0, 5);` |
| `top5Falling` | `[...ENTITIES].sort((a, b) => a.vel4q - b.vel4q).slice(0, 5);` |
| `timeInRegime` | `REGIMES.map(r => ({` |
| `tailContrib` | `[...ENTITIES].sort((a, b) => b.dmi - a.dmi).slice(0, 10).map((e, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIMES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Highest-Risk Sector Index | — | DME sector aggregation | GICS sector with the highest current sector materiality index value |
| Fastest-Rising Sector | — | DME momentum engine | Sector showing the largest absolute 12-month increase in sector materiality index |
| Index Universe Coverage | — | Entity universe | Total entities and GICS sectors included in the sector index calculation |
| Cross-Sector Dispersion (σ) | — | Index statistics | Standard deviation of sector materiality index values, measuring cross-sector risk differentiation |
- **DME entity materiality scores (all universe entities)** → Market-cap weighting and GICS sector aggregation → **Sector Materiality Index values and 12-month time series**
- **Market capitalisation data (daily)** → Float-adjusted market-cap weight calculation per entity within sector → **Entity weight in sector index**
- **Index momentum engine** → 12-month change calculation and cross-sector dispersion statistics → **Sector momentum ranking and dispersion report for ESG factor analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** Sector Materiality Index
**Headline formula:** `SMIₛ = Σᵢ∈ₛ (EMSᵢ × MarketCapᵢ) / Σᵢ∈ₛ MarketCapᵢ`

The sector materiality index is a market-cap-weighted average of entity materiality scores within each GICS sector, providing a capitalisation-weighted signal of aggregate sector ESG risk. Index momentum (12-month change) is used as a sector rotation factor in quantitative ESG strategies.

**Standards:** ['GICS Sector Classification', 'MSCI ESG Index Methodology', 'SASB Materiality Map']
**Reference documents:** MSCI (2023) ESG Ratings Methodology â€” Sector Materiality Weights; SASB (2023) Materiality Map by Industry; GICS (2023) Global Industry Classification Standard; FTSE Russell (2023) FTSE4Good Index Series Methodology

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The DME Dynamic Materiality Index (EP-BE3) is an **index-construction** module: it blends a financial-risk
score, an ESG score and a momentum (velocity) component into a single **DMI**, smooths it with an EMA,
classifies a regime by z-score, and reports portfolio concentration (HHI) and rank agreement (Spearman)
vs an ESG-rating proxy. The guide's DMI framing matches the code here (unlike sibling DME pages), so **no
mismatch flag** — the caveat is only that all 40 entities are synthetic.

### 7.1 What the module computes

```js
DMI = frScore·0.40 + esgScore·0.40 + clamp(velScore,0,100)·0.20        (DEFAULT_WEIGHTS)
```
with two nested composites:
```
frScore  = frVar·0.30 + frPd·0.30 + frWacc·0.20 + frLiq·0.20           (FR_W)
esgScore = esgGov·0.25 + esgEnv·0.35 + esgSoc·0.20 + esgReg·0.20        (ESG_W)
```
**Momentum** comes from a 24-quarter history smoothed and differenced:
```
emaHistory = EMA(rawHistory, α=0.2):  e_i = 0.2·v_i + 0.8·e_{i−1}
velocity(e, lag=4)_i = (e_i − e_{i−lag}) / max(1e-4, |e_{i−lag}|)       // 4-qtr % change
velScore = clamp(50 + lastVelocity·200, 0, 100)                        // centred at 50
```
**Regime** by fixed-parameter z-score: `z = (DMI − 55)/14`, banded Normal/Elevated/Critical/Extreme.
**Portfolio** analytics: `HHI = Σ wᵢ²` (concentration) and `Spearman(x,y) = 1 − 6Σd²/(n(n²−1))`
(rank correlation of DMI vs an ESG proxy series).

### 7.2 Parameterisation / scoring rubric

| Weight set | Values | Provenance |
|---|---|---|
| DMI top level | FR 0.40 / ESG 0.40 / Velocity 0.20 | `DEFAULT_WEIGHTS` (user-configurable, Tab 2) |
| FR sub-components | VaR 0.30 / PD 0.30 / WACC 0.20 / Liquidity 0.20 | `FR_W` — heuristic |
| ESG sub-components | Env 0.35 / Gov 0.25 / Soc 0.20 / Reg 0.20 | `ESG_W` — env-weighted heuristic |
| EMA α | 0.20 | smoothing constant |
| Velocity lag | 4 quarters | 1-year momentum |
| Regime z params | mean 55, std 14 | fixed (not sample-estimated) |

Seeded sub-scores (all `sr()`): frVar 20–95, frPd 15–95, frWacc 25–95, frLiq 10–95; esgGov 20–95,
esgEnv 15–95, esgSoc 25–95, esgReg 10–95; rawHistory 40–95 over 24 quarters.

### 7.3 Calculation walkthrough

1. `ENTITIES` (40) each get seeded FR and ESG sub-scores → `frScore`, `esgScore`.
2. A 24-quarter `rawHistory` is EMA-smoothed; the last 4-quarter velocity → `velScore`.
3. `DMI` = weighted blend; `z = (DMI−55)/14` → regime.
4. Portfolio tab computes HHI over entity weights and Spearman(DMI, ESG-proxy) for validity checks.
5. Alerts trigger off DMI regime crossings.

### 7.4 Worked example

Entity with frVar=60, frPd=50, frWacc=70, frLiq=40:
`frScore = 60·0.30 + 50·0.30 + 70·0.20 + 40·0.20 = 18+15+14+8 = 55.0`.
ESG with gov=65, env=70, soc=55, reg=60: `esgScore = 65·0.25 + 70·0.35 + 55·0.20 + 60·0.20
= 16.25+24.5+11+12 = 63.75`.
Suppose lastVelocity = +0.08 → `velScore = clamp(50 + 0.08·200,0,100) = 66`.
`DMI = 55·0.40 + 63.75·0.40 + 66·0.20 = 22 + 25.5 + 13.2 = 60.7`.
`z = (60.7 − 55)/14 = 0.41` → **Normal** (z ≤ 1). Positive momentum lifts DMI above its FR/ESG mean.

### 7.5 Data provenance & limitations

- **All 40 entities synthetic**, via `sr(seed)=frac(sin(seed+1)×10⁴)`; the 24-quarter histories are
  `sr()`-generated random walks, so EMA/velocity operate on noise, not real signals.
- Regime z uses **fixed** mean 55 / std 14 rather than the sample distribution, so the regime bands are
  effectively pre-set thresholds (z=1 ↔ DMI=69, z=2 ↔ DMI=83…), not adaptive.
- `velScore` normalisation (`50 + vel·200`) is a linear heuristic; large single-quarter moves saturate.

**Framework alignment:** an internal **composite-index** methodology in the spirit of ESG index
construction (MSCI/S&P DJSI weighting of E/S/G pillars) plus a momentum overlay. EMA smoothing and
z-score regime classification are standard time-series techniques; HHI is the **Herfindahl-Hirschman**
concentration index; Spearman ρ is the rank-agreement check used to validate a new score against an
established rating (here an ESG-rating proxy).

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production Dynamic Materiality Index that fuses real financial-risk and ESG signals into a monitorable
composite with defensible momentum and regime states, for the covered universe — supporting watchlist
triage and early-warning alerting.

### 8.2 Conceptual approach
Treat the DMI as a **multi-factor composite with a data-driven regime model**: pillar scores from real
inputs, EWMA momentum, and a **rolling-window z-score / HMM regime** rather than fixed mean-55/std-14.
Benchmarks: MSCI ESG rating pillar aggregation, S&P DJSI CSA weighting, and standard factor-index
construction (equal-risk-contribution weighting).

### 8.3 Mathematical specification
```
frScoreᵢ  = Σ_k w_k · standardise(riskFactor_{i,k})     (VaR, PD, WACC uplift, liquidity)
esgScoreᵢ = Σ_p w_p · pillarScore_{i,p}                 (E/S/G/Reg, exposure-weighted)
DMIᵢ,t    = a·frᵢ,t + b·esgᵢ,t + c·momentumᵢ,t ,  a+b+c=1
momentum  = (EWMA_λ(DMI)_t − EWMA_λ(DMI)_{t−4}) / |EWMA_{t−4}|
z_i,t     = (DMIᵢ,t − μ_roll)/σ_roll  (36-period rolling)   or HMM state posterior
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Pillar weights | w_p | SASB/MSCI materiality by sector |
| Factor standardisation | — | cross-sectional z within sector |
| EWMA λ | 0.2 (α) | tuned to signal half-life |
| Rolling window | 36 quarters | regime stability vs responsiveness |

### 8.4 Data requirements
Real per-entity VaR/PD/WACC/liquidity (from DME Financial Risk), E/S/G/Reg pillar scores (CDP, SBTi,
controversies), and a licensed ESG rating for Spearman validation. Platform already produces the FR
components in `dme-financial-risk` and holds `reference_data` ESG feeds.

### 8.5 Validation & benchmarking plan
Spearman ρ of DMI vs licensed ESG ratings ≥ 0.5; regime-transition frequency sanity check; backtest that
DMI deterioration leads realised credit/ESG events; sensitivity of DMI rank order to ±20% weight shifts.

### 8.6 Limitations & model risk
Composite indices hide offsetting moves across pillars; fixed weights are subjective. Momentum on noisy
inputs generates false regime flips. Conservative fallback: require corroborating raw-signal movement
before firing a regime-change alert, and disclose the weight scheme alongside the score.

## 9 · Future Evolution

### 9.1 Evolution A — Real component feeds and a validated rating cross-check (analytics ladder: rung 2 → 3)

**What.** This is the rare DME page with **no mismatch flag** — the DMI construction (frScore·0.40 + esgScore·0.40 + velocity·0.20, EMA-smoothed with α=0.2, z-score regime classification, HHI concentration, Spearman rank agreement) matches its guide. The honest caveat is that all 40 entities are synthetic: component scores are `sr()` draws, index weights are seeded, and the rating cross-check compares against fabricated `msciLike`/`sustLike`/`issLike` values. Evolution A keeps the sound index machinery and replaces every input.

**How.** (1) Component feeds from the sibling verticals as they land: frScore inputs (VaR/PD/WACC/liquidity percentiles) from the dme-financial-risk engine, esgScore components from real scored data (esg-ratings-hub / dme-entity topic scores), weights from actual market caps in the company master. (2) Move index computation to `services/dme_index_engine.py` with a persisted `dme_index_history` table — the 24-quarter `emaHistory` becomes real accumulating history instead of a seeded backfill, which is what makes velocity/acceleration meaningful. (3) Rung 3: replace the seeded rating proxies with genuine third-party ratings where licensed (or the public CDP/refinitiv-free subset) so the Spearman agreement statistic becomes a real external-validity check; pin the DMI arithmetic and EMA recursion into `bench_quant.py`.

**Prerequisites.** dme-financial-risk and dme-entity Evolution A (component upstreams); ≥4 quarters of persisted history before momentum outputs unhide (honest-nulls until then). **Acceptance:** bench pin reproduces DMI/EMA/velocity for a fixture entity; the Spearman tab compares against real rating vectors or displays "no licensed ratings" — never seeded look-alikes.

### 9.2 Evolution B — Custom-index construction analyst (LLM tier 2)

**What.** The page already has the UI seams for custom indices (frW/esgW/velW weight sliders, sector heat map, top/bottom movers). Evolution B makes construction conversational: "build me a utilities-plus-energy index with double velocity weight and show the regime distribution and effective N" becomes a tool-call sequence against Evolution A's engine — compute custom DMI per entity, aggregate by sector, return HHI and effective-N — with the analyst narrating results and flagging concentration (`effN = 1/HHI`) against a stated diversification threshold.

**How.** Tool schemas from the new index engine endpoints (compute-index, sector-aggregate, regime-distribution, history-query); grounding corpus = this Atlas record's §7.1 formula block so weight semantics are explained exactly as implemented (weights must sum to 100 with velW as residual, per the page's `velW = 100 − frW − esgW`). Export requests produce the time series through the existing CSV path plus a methodology note auto-drafted from §5. The validator matches every index value, HHI, and effective-N to tool outputs.

**Prerequisites (hard).** Evolution A — a custom index over seeded components with fabricated rating agreement would give quant users a factor that correlates with nothing. **Acceptance:** a scripted replay of the analyst's tool calls reproduces its quoted index values exactly; requesting a backtest against realized returns (not yet built) triggers refusal with a pointer to the rung-4 roadmap, not an invented Sharpe ratio.