# DME Dashboard
**Module ID:** `dme-dashboard` · **Route:** `/dme-dashboard` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Main dashboard of the Dynamic Materiality Engine providing an executive overview of materiality scores, trend signals, and top-ranked material topics across the monitored entity universe. Configurable widgets display heatmaps, score distributions, alert counts, and momentum indicators. Entry point for all DME sub-modules.

> **Business value:** Provides leadership and sustainability teams with a continuously updated, evidence-based view of the organisation's most material ESG topics. The single-entry dashboard ensures all DME analytical modules are accessible from one governed interface.

**How an analyst works this module:**
- Set entity scope and topic weights in DME Configuration to reflect strategic priorities
- Review the materiality heatmap and identify topics in the high-materiality quadrant
- Click through to individual topic cards for evidence, trend charts, and stakeholder signals
- Export the materiality dashboard snapshot for board reporting or ESRS 2 IRO-1 documentation

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERT_COLORS`, `ALERT_TIERS`, `COLORS`, `COMPANY_NAMES`, `DEF_COEFF`, `ENTITIES`, `MODULES`, `MONTHS`, `NGFS_SCENARIOS`, `PILLARS`, `REGIMES`, `REGIME_COLORS`, `REGIONS`, `SECTORS`, `SECTOR_COEFF`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtM` | `(n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}B` : `$${n.toFixed(0)}M`;` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'LATAM', 'Middle East', 'Africa'];` |
| `pdBase` | `0.01 + s(3) * 0.12;` |
| `velocityT` | `-0.3 + s(7) * 0.6;` |
| `pdExp` | `clamp(pdBase * Math.exp(coeff.alphaT * velocityT), 0.001, 0.85);` |
| `assetV` | `500 + s(11) * 4500;` |
| `debt` | `assetV * (0.2 + s(13) * 0.6);` |
| `vol` | `coeff.baseVol + s(17) * 0.1;` |
| `pdMerton` | `clamp(normalCDF(-d2), 0.001, 0.90);` |
| `pdConsensus` | `(pdExp * 0.35 + pdMerton * 0.35 + (pdBase * (1 + s(19) * 0.5)) * 0.30);` |
| `zScore` | `s(23) * 4.2;` |
| `esgScore` | `20 + s(29) * 70;` |
| `envScore` | `20 + s(31) * 70;` |
| `socScore` | `20 + s(37) * 70;` |
| `govScore` | `20 + s(41) * 70;` |
| `dmi` | `esgScore * 0.40 + (100 - pdConsensus * 300) * 0.40 + (50 + s(43) * 50) * 0.20;` |
| `var95` | `assetV * (0.03 + s(47) * 0.12);` |
| `var99` | `var95 * (1.15 + s(53) * 0.25);` |
| `cvar` | `var99 * (1.1 + s(59) * 0.2);` |
| `wacc` | `0.05 + s(61) * 0.12;` |
| `alertCount` | `Math.floor(s(67) * 18);` |
| `nlpSentiment` | `-1 + s(71) * 2;` |
| `mlScore` | `20 + s(73) * 75;` |
| `contagionCentrality` | `s(79) * 0.85;` |
| `coverage` | `60 + s(83) * 40;` |
| `alertTrendData` | `MONTHS.map((m, i) => ({` |
| `regimeTrendData` | `MONTHS.map((m, i) => ({` |
| `ngfsImpactData` | `NGFS_SCENARIOS.map((sc, i) => ({` |
| `badgeS` | `(bg) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: T.mono, background: bg + '22', color: bg });` |
| `avgDmi` | `filtered.reduce((a, e) => a + e.dmi, 0) / n;` |
| `critPct` | `(filtered.filter(e => e.regime === 'Critical' \|\| e.regime === 'Extreme').length / n) * 100;` |
| `alertTotal` | `filtered.reduce((a, e) => a + e.alertCount, 0);` |
| `avgPd` | `filtered.reduce((a, e) => a + e.pdConsensus, 0) / n;` |
| `avgVar95` | `filtered.reduce((a, e) => a + e.var95, 0) / n;` |
| `avgWacc` | `filtered.reduce((a, e) => a + e.wacc, 0) / n;` |
| `avgSentiment` | `filtered.reduce((a, e) => a + e.nlpSentiment, 0) / n;` |
| `avgMl` | `filtered.reduce((a, e) => a + e.mlScore, 0) / n;` |
| `top5` | `useMemo(() => [...filtered].sort((a, b) => b.pdConsensus - a.pdConsensus).slice(0, 5), [filtered]);` |
| `transMatrix` | `useMemo(() => { return REGIMES.map((from, fi) => REGIMES.map((to, ti) => { const v = sr(fi * 4 + ti + 7);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERT_TIERS`, `COLORS`, `COMPANY_NAMES`, `MODULES`, `MONTHS`, `NGFS_SCENARIOS`, `PILLARS`, `REGIMES`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Topics Scored | — | DME topic library | Total ESG topics actively scored by the Dynamic Materiality Engine for the monitored entity |
| High-Materiality Topics (Score > 70) | — | DME scoring engine | Count of topics with a current materiality score exceeding the high materiality threshold of 70/100 |
| Platform Materiality Score | — | DME aggregation | Weighted composite materiality score across all active topics on a 0–100 scale |
| Score Momentum (30d) | — | Trend engine | Change in platform materiality score over the trailing 30-day window |
- **DME scoring engine outputs (78 topic scores, all entities)** → Weighted aggregation using administrator-configured topic weights → **Platform Materiality Score and trend time series**
- **External data signal feeds (news, regulatory, NGO, financial)** → Signal ingestion, NLP classification, and topic attribution → **Per-topic signal count, sentiment, and source diversity**
- **Alert engine** → Threshold comparison and APS calculation → **Alert count and critical alert roster for dashboard widget**

## 5 · Intermediate Transformation Logic
**Methodology:** Platform Materiality Score
**Headline formula:** `PMS = Σᵢ (Topic Scoreᵢ × Topic Weightᵢ) / Σᵢ Weightᵢ`

The platform materiality score is a weighted composite of all scored topics, with weights set by the administrator to reflect entity-specific strategic priorities. It provides a single headline signal for board-level materiality communication.

**Standards:** ['EFRAG Materiality Assessment Guidelines', 'ESRS 1 Chapter 3', 'GRI 3 Material Topics']
**Reference documents:** ESRS 1 (2023) Chapter 3 â€” Double Materiality Assessment; EFRAG (2022) Guidance on Materiality Assessment; GRI 3 (2021) Material Topics â€” Identification and Prioritisation; TCFD (2021) Scenario-Based Materiality Assessment Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a **Platform Materiality Score**
> `PMS = Σ(Topic Scoreᵢ · Weightᵢ)/ΣWeightᵢ` over 78 ESG topics with heat-maps and 30-day momentum
> (ESRS/EFRAG double-materiality framing). **No topic library, no PMS, and no 78-topic weighting exist
> in the code.** The page actually generates **40 synthetic corporates** and runs a
> **Merton-plus-exponential credit-risk engine** (PD consensus, VaR/CVaR, WACC, regime classification)
> plus a composite "DMI" score. It is a *credit-risk dashboard dressed as a materiality dashboard*.
> The sections below document the code.

### 7.1 What the module computes

For each of 40 companies (`COMPANY_NAMES`), a per-entity seed `s(k) = sr(hashStr(name) mod 9973 + i·37 + k)`
drives a full risk profile. The headline **probability of default** is a **consensus of three PD models**:

```js
// 1. Exponential (climate-velocity conditioned)
pdExp     = clamp(pdBase · exp(αT · velocityT), 0.001, 0.85)
// 2. Merton structural (distance-to-default)
d1        = [ln(assetV·(1−haircut)/debt) + (0.04 + 0.5·vol²)·1] / (vol·1)
d2        = d1 − vol
pdMerton  = clamp(Φ(−d2), 0.001, 0.90)          // Φ = Abramowitz-Stegun normal CDF
// 3. Consensus
pdConsensus = pdExp·0.35 + pdMerton·0.35 + (pdBase·(1 + s·0.5))·0.30
```

Other headline outputs:
```
DMI  = esgScore·0.40 + (100 − pdConsensus·300)·0.40 + (50 + s·50)·0.20     // Dynamic Materiality Index
var95 = assetV·(0.03 + s·0.12) ;  var99 = var95·(1.15+s·0.25) ;  cvar = var99·(1.1+s·0.2)
regime = z≤1 Normal | z≤2 Elevated | z≤3 Critical | else Extreme          (z = s·4.2)
stage  = pdConsensus<0.03 S1 | <0.15 S2 | else S3                          (IFRS 9 staging)
```

### 7.2 Parameterisation / scoring rubric

**Sector coefficients** (`SECTOR_COEFF`) — the only structured, non-random parameters:

| Sector | αT (climate PD elasticity) | baseVol | haircut | LGD |
|---|---|---|---|---|
| Energy | 0.18 | 0.35 | 0.25 | 0.55 |
| Materials | 0.14 | 0.28 | 0.18 | 0.48 |
| Utilities | 0.15 | 0.22 | 0.20 | 0.45 |
| Financials | 0.09 | 0.24 | 0.10 | 0.50 |
| Technology | 0.07 | 0.32 | 0.05 | 0.35 |
| Healthcare | 0.06 | 0.22 | 0.06 | 0.38 |
| default | 0.08 | 0.25 | 0.10 | 0.42 |

These are **synthetic sector priors** (no citation) but ordered sensibly: carbon-exposed sectors carry
higher climate PD elasticity (αT) and stranded-asset haircut. Seeded ranges (all via `sr`):
`pdBase 1–13%`, `velocityT −0.3…+0.3`, `assetV $500–5000M`, `debt 20–80% of assets`, `esg/env/soc/gov
20–90`, `wacc 5–17%`, `mlScore 20–95`, `nlpSentiment −1…+1`, `contagionCentrality 0–0.85`.

### 7.3 Calculation walkthrough

1. `generateEntities()` builds 40 profiles from the name-hash seed.
2. Filters (sector/region/regime) narrow the set; portfolio KPIs average over the filtered set:
   `avgDmi`, `critPct` (% Critical+Extreme), `alertTotal`, `avgPd`, `avgVar95`, `avgWacc`,
   `avgSentiment`, `avgMl`.
3. `top5` = the five highest `pdConsensus` obligors.
4. `transMatrix` = a 4×4 regime transition matrix, `sr(fi·4+ti+7)`-seeded (synthetic Markov chain).
5. Trend charts (`alertTrendData`, `regimeTrendData`) and `ngfsImpactData` map the 6 NGFS scenario
   labels to seeded impacts.

### 7.4 Worked example (one obligor, Merton leg)

Energy entity: `assetV = 3000`, `haircut = 0.25`, `debt = 1500`, `vol = 0.35`.
```
ln(3000·0.75 / 1500) = ln(1.5) = 0.4055
drift term = (0.04 + 0.5·0.35²)·1 = 0.04 + 0.061 = 0.101
d1 = (0.4055 + 0.101)/0.35 = 0.5065/0.35 = 1.447
d2 = 1.447 − 0.35 = 1.097
pdMerton = Φ(−1.097) ≈ 0.136 → 13.6%
```
If `pdExp = 0.05` and `pdBase = 0.06`: `pdConsensus = 0.05·0.35 + 0.136·0.35 + 0.06·1.2·0.30
= 0.0175 + 0.0476 + 0.0216 = 0.0867 → 8.67%`. Stage: 8.67% ∈ [3%,15%) → **S2**.
DMI with esg=60: `60·0.40 + (100 − 0.0867·300)·0.40 + (75)·0.20 = 24 + (100−26)·0.40 + 15
= 24 + 29.6 + 15 = 68.6`.

### 7.5 Data provenance & limitations

- **All 40 entities are synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)` off a djb2 name hash.
  Sector coefficients are hand-set priors, not calibrated.
- The **Merton leg is genuine** (correct d1/d2 and Φ(−d2)) but its *inputs* (asset value, vol, debt)
  are random, so `pdMerton` is a plausible-looking but non-real number.
- DMI's second term `(100 − pdConsensus·300)` can go negative for pdConsensus>1/3 (then clamped by the
  `dmi: clamp(…,10,95)` wrapper) — a heuristic, not a materiality standard.
- No connection to the guide's 78-topic materiality library; "Platform Materiality Score" is unimplemented.

**Framework alignment:** **Merton (1974) structural default** model (distance-to-default → PD via the
normal CDF, the basis of Moody's KMV/EDF); **IFRS 9** three-stage staging (S1/S2/S3 by PD bands);
**NGFS** scenario labels (Orderly/Disorderly/Hot-House/Too-Little-Too-Late) used only as chart
categories; **VaR/CVaR** as portfolio tail-risk headlines. The climate-conditioned `pdExp = pdBase·exp(αT·velocityT)`
is a reduced-form transition overlay echoing NGFS/EBA "PD-multiplier" stress designs.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production climate-adjusted credit-risk dashboard: PD/LGD/ECL, VaR/CVaR and IFRS 9 staging for the
covered obligor book, conditioned on NGFS transition/physical pathways. Replaces the `sr()`-seeded
inputs with real balance-sheet and market data.

### 8.2 Conceptual approach
**Merton structural PD with climate-conditioned asset drift** (per Moody's climate-adjusted EDF and
Aladdin transition-risk repricing) blended with a **reduced-form hazard PD** calibrated to NGFS/EBA
PD multipliers. Benchmarks: Moody's EDF/KMV, MSCI Climate VaR, BlackRock Aladdin Climate, EBA/ECB
climate stress-test PD-uplift methodology.

### 8.3 Mathematical specification
```
Asset value A, debt D, vol σ_A, risk-free r, horizon T:
  d2 = [ln(A/D) + (r − climateDrift − 0.5σ_A²)T] / (σ_A√T)
  PD_structural = Φ(−d2)
climateDrift_s = αT_s · transitionVelocity + βP_s · physicalVelocity   (sector s)
PD_reducedform = PD_base · exp(scenario PD-multiplier − 1)             (NGFS-calibrated)
PD = w1·PD_structural + w2·PD_reducedform ,  w1+w2 = 1
ECL = PD · LGD_s · EAD ;  Stage: S1 PD<τ1, S2 SICR, S3 impaired
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Asset vol | σ_A | equity vol de-levered (Merton), market data |
| Climate drift elasticities | αT_s, βP_s | NGFS Phase IV sector damage/repricing paths |
| PD multipliers | — | EBA/ECB 2022 climate stress-test parameters |
| LGD by sector | LGD_s | PCAF / internal recovery data |
| Staging thresholds | τ | IFRS 9 §5.5 SICR policy |

### 8.4 Data requirements
Obligor balance sheet (assets, debt, EAD), equity price/vol, sector mapping, NGFS scenario variable set
(carbon price, GDP, physical hazard). Platform already holds `SECTOR_COEFF`, NGFS scenario labels, and
`climate_scenarios` migration tables that can supply real pathway variables.

### 8.5 Validation & benchmarking plan
Reconcile PD term structure against Moody's EDF where obligors overlap; backtest realised defaults vs
predicted PD (calibration curve, Brier score); sensitivity of ECL to ±1 NGFS scenario notch; VaR
backtest (Kupiec/Christoffersen) on the return series.

### 8.6 Limitations & model risk
Merton assumes lognormal assets and a single debt point — poor for financials and complex capital
structures. Climate drift elasticities are deeply uncertain at the obligor level. Conservative fallback:
where asset vol is unobservable, default to sector-median σ and flag the PD as low-confidence rather
than emitting a precise-looking number.

## 9 · Future Evolution

### 9.1 Evolution A — Make the dashboard read the DME engines it fronts (analytics ladder: rung 1 → 2)

**What.** The §7 flag calls it precisely: this is "a credit-risk dashboard dressed as a materiality dashboard." The guide's Platform Materiality Score (`PMS = Σ topic·weight / Σweight` over 78 topics) doesn't exist; instead 40 synthetic corporates get a seeded Merton-plus-exponential PD consensus, VaR/CVaR, WACC, and a composite "DMI" — competent formulas over fabricated inputs (`pdBase = 0.01 + s(3)·0.12`, `assetV = 500 + s(11)·4500`). Meanwhile the real DME backends this dashboard should front — `dme_alert_engine`, `dme_contagion_engine`, `dme-pd-engine`, `dme-index` — sit uncalled. Evolution A rewires the dashboard as a thin aggregation layer over those engines.

**How.** (1) New `GET /api/v1/dme/dashboard-summary` endpoint aggregating: alert counts from the dme-alerts archive (its Evolution A), PD outputs from the dme-pd-engine backend, contagion centralities from dme-contagion, and topic materiality scores from dme-index — replacing every `s(k)` draw. (2) Implement the guide's PMS honestly as the weighted topic composite once dme-index persists topic scores; admin-configured weights live in a `dme_topic_weights` table. (3) The in-page Merton machinery either moves server-side under dme-pd-engine (where a real implementation belongs) or is deleted — a dashboard should not own a credit model. (4) The seeded regime transition matrix becomes an observed-frequency matrix over persisted regime history.

**Prerequisites.** Sibling DME modules' persistence layers (score history, alert archive) — the dashboard is downstream of everything. **Acceptance:** every KPI on the page traces to a named engine endpoint in a lineage sweep; deleting the local `sr()` helper breaks nothing.

### 9.2 Evolution B — Board-pack copilot over live engine state (LLM tier 1)

**What.** The stated workflow ends at "export the materiality dashboard snapshot for board reporting or ESRS 2 IRO-1 documentation." A tier-1 copilot makes that snapshot self-explaining: "why did the platform score drop 4 points this month?" answered from the real dashboard-summary payload — which topics moved, which entities drove the alert spike, what the regime shift means — with each claim cited to the aggregated engine outputs and the ESRS 1 Chapter 3 framing from the module's own reference corpus.

**How.** Explanation-only over the `dashboard-summary` response plus this Atlas record embedded per the roadmap's tier-1 pattern (pgvector corpus, per-module system prompt, prompt-cached). No tool-calling needed initially — the payload the page already fetched is the grounding context. The IRO-1 draft assist composes the documented topic scores and weights into ESRS 2 boilerplate through the report-studio layer, with uncomputed fields rendered as explicit gaps.

**Prerequisites (hard).** Evolution A first, without exception — today the copilot would eloquently explain a fabricated PD consensus for 40 real company names, the exact fabrication-narration failure the platform's guardrails exist to prevent. **Acceptance:** every numeric in a copilot answer appears verbatim in the dashboard-summary payload; "what's our Scope 3 materiality score?" refuses when the topic isn't in the scored set rather than inventing one.