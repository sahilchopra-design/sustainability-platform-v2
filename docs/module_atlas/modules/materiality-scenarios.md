# Materiality Scenarios
**Module ID:** `materiality-scenarios` · **Route:** `/materiality-scenarios` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Forward-looking materiality assessment engine that evaluates how ESG topic materiality evolves under different regulatory, market, and climate scenarios. Integrates CSRD double materiality, ISSB financial materiality, and SASB sector standards with scenario-specific impact and likelihood adjustments. Enables dynamic materiality mapping that anticipates regulatory shifts and stakeholder expectation changes over 5–10 year horizons.

> **Business value:** Enables sustainability managers and auditors to build defensible, forward-looking materiality assessments that anticipate regulatory change and satisfy CSRD ESRS 1 and ISSB S1 requirements for dynamic, scenario-informed topic selection.

**How an analyst works this module:**
- Define the materiality assessment scope, sector classification, and value chain boundaries for the entity
- Select scenario set: regulatory acceleration, market repricing, physical intensification, or combined stress
- Review scenario-adjusted materiality heat map showing score changes per topic per scenario
- Identify emerging topics crossing the materiality threshold under adverse scenarios and prioritise for disclosure
- Export scenario-adjusted materiality matrix for integration into CSRD DMA documentation and ISSB S1 disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ESRS_TOPICS`, `KpiCard`, `LS_KEY_CUSTOM`, `LS_KEY_PORTFOLIO`, `MATERIALITY_SCENARIOS`, `MATERIAL_THRESHOLD`, `MaterialityScenariosPage`, `NavBtn`, `Pill`, `SECTORS`, `SECTOR_WEIGHTS`, `Section`, `SortableTable`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ESRS_TOPICS` | 11 | `label`, `pillar` |
| `MATERIALITY_SCENARIOS` | 5 | `name`, `color`, `icon`, `description`, `adjustments`, `E1`, `E2`, `E3`, `E4`, `E5`, `S1`, `S2`, `S3`, `S4`, `G1` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `seededRandom` | `seed => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `baseline` | `useMemo(() => buildBaselineScores(), []);  /* toggle scenario */ const toggleScenario = id => { setSelectedScenarios(prev => { if (prev.includes(id)) return prev.filter(x => x !== id);` |
| `delta` | `Math.abs((scores[t.id]?.financial \|\| 0) - baseline[t.id].financial);` |
| `portfolioImpact` | `(reclassCount * 2.3 + newMaterial * 3.1).toFixed(1);` |
| `mostAffected` | `Object.entries(sectorVulnerability).sort((a, b) => b[1] - a[1])[0];` |
| `deltaData` | `useMemo(() => { return ESRS_TOPICS.map(t => { const row = { topic: t.id, label: t.label };` |
| `scatterBaseline` | `useMemo(() => ESRS_TOPICS.map(t => ({ ...t, x: baseline[t.id].financial, y: baseline[t.id].impact, cls: classify(baseline[t.id].financial, baseline[t.id].impact) })), [baseline]);` |
| `topTopic` | `ESRS_TOPICS[Math.abs(seed) % ESRS_TOPICS.length];` |
| `sector` | `c.sector \|\| SECTORS[Math.abs(seed) % SECTORS.length];` |
| `materialityShift` | `Math.round(adj * (0.6 + sr(seed, 3) * 0.8));` |
| `sectorVulnData` | `useMemo(() => { return SECTORS.map(sec => { const row = { sector: sec };` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `newFin` | `Math.min(100, Math.max(0, baseline[t.id].financial + adj));` |
| `newCls` | `classify(newFin, Math.min(100, Math.max(0, baseline[t.id].impact + Math.round(adj * 0.8))));` |
| `expected` | `Math.round(MATERIALITY_SCENARIOS.reduce((s, sc, i) => {` |
| `expectedCls` | `classify(expected, Math.round(expected * 0.85));` |
| `gap` | `MATERIAL_THRESHOLD - baseline[t.id].financial;` |
| `vals` | `MATERIALITY_SCENARIOS.map(sc => sc.adjustments[t.id] \|\| 0);` |
| `maxDiv` | `Math.max(...vals) - Math.min(...vals);` |
| `totalAdj` | `pillarTopics.reduce((s, t) => s + (sc.adjustments[t.id] \|\| 0), 0);` |
| `avgAdj` | `+(totalAdj / pillarTopics.length).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ESRS_TOPICS`, `MATERIALITY_SCENARIOS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Topics Above Materiality Threshold (%) | — | Scenario-adjusted DMA output | Share of assessed ESG topics meeting materiality threshold in the analysis scenario |
| Regulatory Scenario Probability (%) | — | Expert elicitation / regulatory pipeline | Assigned probability of the regulatory scenario materialising within the assessment horizon |
| Materiality Score Variance (Δ) | — | Cross-scenario comparison | Absolute difference in materiality score for a topic between the base and the most adverse scenario |
| Topic Emergence Lead Time (yrs) | — | Trend extrapolation model | Estimated years until a currently sub-threshold topic crosses the materiality threshold under the trend scenario |
- **Prior DMA stakeholder survey results** → Score topics on impact significance and financial significance scales; apply ESRS 1 thresholds → **Base-year materiality assessment matrix**
- **Regulatory scenario pipeline database** → Assign probability and impact adjustment to each pending regulation per scenario → **Scenario-specific ΔLikelihood and ΔImpact per regulatory topic**
- **SASB sector materiality benchmarks** → Cross-reference entity sector against SASB peer materiality consensus; adjust priors → **Sector-informed base materiality priors for scenario adjustment calibration**

## 5 · Intermediate Transformation Logic
**Methodology:** Scenario-Adjusted Materiality Score
**Headline formula:** `SMSᵢₛ = Materialityᵢ × (1 + ΔLikelihoodᵢₛ + ΔImpactᵢₛ)`

Base materiality scores reflect current impact and financial significance per ESRS 1 and IFRS S1 criteria. Scenario adjustments (Δ) modify likelihood and impact estimates based on regulatory probability, market repricing, and physical hazard intensification in each scenario. Scenario weighting enables probability-adjusted materiality profiles for multi-scenario disclosure.

**Standards:** ['CSRD ESRS 1 Double Materiality Standard 2023', 'ISSB IFRS S1 Materiality Guidance 2023', 'SASB Materiality Map 2023', 'TCFD Scenario Analysis Guidance 2021']
**Reference documents:** CSRD ESRS 1 General Requirements Standard â€” Double Materiality Guidance 2023; ISSB IFRS S1 General Requirements for Disclosure of Sustainability-related Financial Information 2023; SASB Materiality Map and Standards 2023; TCFD Technical Supplement: The Use of Scenario Analysis in Disclosure 2017; EFRAG Implementation Guidance on Materiality Assessment 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Survey-derived baselines and probability-weighted scenarios (analytics ladder: rung 2 → 3)

**What.** The scenario mechanics are honest what-if (fixed per-topic adjustment vectors, additive shifts, a 60-point double-materiality classifier, an expected-value view over scenarios) — genuinely rung 2 — but §7 flags the divergences: the guide's multiplicative `SMS = M × (1 + ΔLikelihood + ΔImpact)` is implemented as additive point-shifts with no likelihood term; scenario probabilities are absent from the adjustment math despite the "expected" view implying them; the baseline is *seeded* (`35 + s·55`), not the prior-DMA survey data the lineage describes; and the "topic emergence lead time" model doesn't exist. Evolution A: (1) baseline scores read from the entity's actual materiality assessment (the issb-materiality evolution's evidence-based layer — one assessment store serving the materiality family); (2) scenario adjustments restructured per the guide's form with explicit likelihood and impact deltas and elicited scenario probabilities, so the expected-value view is a real probability-weighted mixture; (3) emergence lead time computed as the year the trend-scenario trajectory crosses the threshold — a small, honest derivation from the machinery that exists.

**How.** (1) The adjustment vectors become documented expert-elicitation records (author, date, rationale per topic-scenario cell) rather than anonymous constants — for DMA documentation defensibility, provenance of the judgement *is* the deliverable. (2) The 0.8 impact-coupling factor either justified or replaced by independent impact deltas. (3) Sector priors from the SASB materiality data (shared with materiality-hub's cross-walk work). (4) Export mapped to EFRAG DMA documentation structure per the §1 workflow.

**Prerequisites.** The sibling assessment store; elicitation session to source probabilities and deltas (analytical work, not code). **Acceptance:** baselines match the entity's recorded assessment; the expected view recomputes when a scenario probability changes; every adjustment cell carries elicitation provenance; lead-time figures derive from visible trajectories.

### 9.2 Evolution B — Forward-materiality workshop copilot (LLM tier 2)

**What.** Scenario-based materiality is workshop work — arguing about which topics cross thresholds under which futures — and the copilot's role is disciplined facilitation: "under regulatory acceleration, which of our sub-threshold topics reclassify and why?", "build a custom scenario: CSRD enforcement tightens, carbon price doubles — propose adjustment deltas with rationale for my review", "draft the DMA forward-looking section documenting our scenario analysis." Proposed deltas are suggestions with reasoning, entering the elicitation record only on analyst confirmation — the copilot as elicitation scribe, not oracle.

**How.** Tier 2 over the scenario/classification routes: reclassification answers show the arithmetic (baseline + delta vs threshold) per topic; custom-scenario proposals ground rationale in the curated driver/regulatory context (shared with materiality-trends' driver database) and are stored as machine-suggested pending confirmation. DMA drafting maps the scenario analysis to ESRS 1's forward-looking requirements with each claim bound to a recorded scenario cell — auditors will ask "who decided E4 gains 12 points under repricing, and why", and the answer must be a person and a rationale, not a model. The single/double materiality classifier logic quoted verbatim when explaining reclassifications.

**Prerequisites (hard).** Evolution A's provenance-carrying elicitation store (a copilot proposing deltas into an anonymous constants file would launder judgement); Phase 2 tooling. **Acceptance:** every reclassification claim shows its arithmetic; proposed deltas carry rationale and confirmation state; DMA drafts cite recorded cells with elicitation provenance.