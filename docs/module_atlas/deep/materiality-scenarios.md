## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states a *multiplicative* engine —
> `SMS = Materiality × (1 + ΔLikelihood + ΔImpact)` — with per-topic likelihood and impact
> adjustments and scenario probability weighting. **The code uses simple additive point-shifts**:
> `financial = baseline + adj`, `impact = baseline + round(adj·0.8)`, clamped to [0,100]. There is
> no likelihood term, no probability weighting of scenarios, and no "topic emergence lead time"
> trend-extrapolation model — the four scenarios are fixed adjustment vectors, and the baseline is
> seeded, not survey-derived. Documented below is the additive simulator that actually runs.

### 7.1 What the module computes

Four preset "future scenarios" (plus a slider-built custom one) each shift the ten ESRS topics'
financial and impact scores by a fixed per-topic point delta, then re-classify each topic against a
60-point double-materiality threshold and count the reclassifications:

```js
baseline[t] = { financial: 35 + s·55, impact: 30 + s'·60 }   // s,s' = seeded per topic id
scenario[t].financial = clamp(0,100, baseline[t].financial + adj[t])
scenario[t].impact    = clamp(0,100, baseline[t].impact + round(adj[t]·0.8))
classify(fin,imp): fin≥60 && imp≥60 → "Double Material"
                   fin≥60 → "Financial Material" ; imp≥60 → "Impact Material" ; else "Not Material"
```

Impact is moved at 80 % of the financial adjustment — an editorial assumption that regulatory/market
shocks hit the *financial* lens slightly harder than the *impact* lens.

### 7.2 Parameterisation / scoring rubric

**Scenario adjustment vectors** (`MATERIALITY_SCENARIOS`) — hand-authored point deltas per topic,
**synthetic expert-judgement demo values**:

| Scenario | E1 | E4 | E3 | S2 | G1 | Narrative |
|---|---|---|---|---|---|---|
| Regulatory Acceleration | +20 | +18 | +12 | +15 | +15 | CSRD scope expands, carbon price doubles, CSDDD/TNFD mandatory |
| Market-Driven Transition | +15 | +10 | +5 | +8 | +8 | ESG funds dominate AUM, green premium |
| ESG Backlash & Fragmentation | −5 | −5 | −2 | +3 | +10 | US/UK backlash; governance/greenwashing rise |
| Nature & Social Crisis | +5 | +30 | +25 | +15 | +5 | Ecosystem tipping points; nature overtakes climate |

**`MATERIAL_THRESHOLD = 60`** — the materiality cut-off on the 0–100 scale (demo choice; ESRS
itself sets no numeric threshold, it is entity-defined).

**`SECTOR_WEIGHTS`** (Σ = 1.0) — sector exposure weights (Financials 0.16, Energy 0.14, Technology
0.13…) used only for the sector-vulnerability ranking. **Synthetic.**

**Baseline** — `buildBaselineScores()` seeds each topic via `sr(hashStr(topic_id), offset)`, giving
financial ∈ [35,90] and impact ∈ [30,90]. Deterministic across renders but not real.

### 7.3 Calculation walkthrough

1. `buildBaselineScores` produces the base matrix (10 topics × {financial, impact}).
2. For each active scenario (max 2 compared), `applyScenario` adds the vector and clamps.
3. `classify` labels base and scenario states; `reclassifications` logs every topic whose label
   changes (with from→to and the triggering scenario).
4. KPIs: `reclassCount`, `newMaterial` (Not-Material→Material), `dematerialized`, `maxDelta`
   (largest absolute financial shift), and a composite `portfolioImpact = reclassCount·2.3 +
   newMaterial·3.1` (the 2.3/3.1 weights are arbitrary demo coefficients).
5. `sectorVulnerability[sec] = round(Σ_t |adj[t]| · SECTOR_WEIGHTS[sec])`; the max-vulnerability
   sector is surfaced as `mostAffected`.

### 7.4 Worked example (Regulatory Acceleration, topic E1)

Say `buildBaselineScores` yields `E1 = { financial: 58, impact: 62 }` (below the financial
threshold, above the impact threshold → base class **Impact Material**). Regulatory Acceleration
sets `adj[E1] = +20`.

| Step | Computation | Result |
|---|---|---|
| Scenario financial | clamp(0,100, 58 + 20) | **78** |
| Scenario impact | clamp(0,100, 62 + round(20·0.8)) | 62 + 16 = **78** |
| Base class | fin 58<60, imp 62≥60 | Impact Material |
| New class | fin 78≥60 && imp 78≥60 | **Double Material** |
| Reclassification | Impact Material → Double Material | logged |
| maxDelta contribution | \|78 − 58\| | 20 |

Sector vulnerability for Financials = round(Σ|adj|·0.16). Σ|adj| for Regulatory Acceleration =
20+15+12+18+10+8+15+12+5+15 = 130 → 130·0.16 = **20.8 → 21**.

### 7.5 Data provenance & limitations

- **Baseline scores are seeded** by `sr(seed)=frac(sin(seed+1)×10⁴)` — stable but not entity- or
  survey-derived. Scenario vectors and sector weights are hand-set demo values.
- **Additive, not multiplicative** — the guide's `× (1 + Δ)` form is not implemented; there is no
  likelihood dimension and no scenario probability weighting, so the output is a deterministic
  what-if, not a probability-adjusted materiality profile.
- Portfolio impact (`·2.3`, `·3.1`) and impact-adjustment ratio (`·0.8`) are unsourced coefficients.
- `companies`/`portfolio` are read but the topic-level simulation does not vary by entity — the same
  10-topic matrix is used regardless of portfolio composition.

**Framework alignment:** CSRD ESRS 1 double materiality — the two-axis (impact × financial) classify
rule with an "either-crosses" logic is faithful to ESRS 1 (a topic is material if impact *or*
financial significance is material). ISSB IFRS S1 (financial materiality) is reflected only via the
financial axis. TCFD scenario analysis — the four scenarios are qualitative narrative scenarios in
the TCFD tradition but are not linked to any quantitative climate pathway (NGFS/IEA); the deltas are
editorial, not model-derived.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A forward-looking, probability-weighted materiality engine that projects how each ESRS topic's impact
and financial significance evolves under regulatory, market, physical and combined scenarios over a
5–10 year horizon, producing a probability-adjusted material-topic set for CSRD ESRS 1 and ISSB S1
disclosure. Scope: one entity, 10 ESRS topical standards, 3–5 scenarios with assigned probabilities.

### 8.2 Conceptual approach
Two-factor scenario-adjusted materiality with a probability layer, benchmarked against EFRAG IG-1
(materiality assessment), NGFS scenario framing and the TCFD scenario-analysis supplement. Unlike the
current additive shifts, adjustments are driven by *scenario-conditioned* likelihood and magnitude
factors, and the headline output is a probability-weighted expected materiality score per topic —
mirroring how climate-VaR engines probability-weight scenario losses.

### 8.3 Mathematical specification

```
SMS_{t,s} = M_t · (1 + ΔL_{t,s} + ΔI_{t,s})              // per guide, now implemented
E[SMS_t]  = Σ_s π_s · SMS_{t,s}                           // probability-weighted expected score
Material_t = 1[ E[SMS_t]_financial ≥ θ ]  OR  1[ E[SMS_t]_impact ≥ θ ]
LeadTime_t = min{ y : M_t + v_t·y ≥ θ }                  // emergence year from trend velocity v_t
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Base materiality | M_t | Prior-year DMA survey (impact & financial, 0–100) |
| Likelihood shift | ΔL_{t,s} | Regulatory-pipeline probability × scenario s |
| Impact shift | ΔI_{t,s} | Repricing/hazard intensity per scenario (NGFS/IEA) |
| Scenario probability | π_s | Expert elicitation; Σπ_s = 1 |
| Threshold | θ | Entity-set, EFRAG IG-1 (default 60/100) |
| Trend velocity | v_t | 12-month MTI delta (from `materiality-trends`) |

### 8.4 Data requirements
Prior-year DMA scores per topic; regulatory-pipeline database with enactment probabilities; NGFS
Phase-IV / IEA WEO scenario parameters for the physical/transition magnitude shifts; sector priors
(SASB). Platform assets: the `dynamic-materiality` engine, `materiality-trends` MTI velocity, and
`SECTOR_WEIGHTS` here can supply π_s priors and v_t.

### 8.5 Validation & benchmarking plan
Back-test: did topics the model flagged as "emerging under adverse scenario" actually become material
in the following reporting cycle? Sensitivity-test θ ±5 and π_s ±0.1 for set stability. Reconcile the
probability-weighted material set against peer DMAs and CSRD-published double-materiality matrices.

### 8.6 Limitations & model risk
Scenario probabilities π_s are subjective and dominate the expected score; likelihood/impact shifts
for long-horizon nature topics are weakly evidenced. Conservative fallback: report the *union* of
per-scenario material sets alongside the probability-weighted set, so no topic is dropped purely
because its expected score is diluted by low-probability scenarios.
