## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `SERS = E_mag×w_e + S_mag×w_s + G_mag×w_g`
> — a pillar-weighted composite. **No E/S/G pillar decomposition or weighting exists in the code.**
> Each of the 40 "systemic risk indicators" (a mix of genuine ESG-adjacent themes like "Social
> Inequality Stress" and pure physical-climate tipping-point themes like "AMOC Collapse", "Greenland
> Melt Rate") carries an independently `sr()`-seeded `systemicScore` (10–95) with no E/S/G tagging
> or weight anywhere in the 123-line file — only a flat `category` label (Climate/Social/Governance/
> Financial/Geopolitical/Environmental/Technological, 7 categories, not the guide's 3-pillar E/S/G
> split). The "Governance Risk Premium (12 bps)" and "Correlated ESG Events (YTD): 7" data points
> named in the guide have no corresponding calculation either.

### 7.1 What the module computes

40 named systemic-risk indicators (`INDICATORS`) spanning climate physical tipping points (AMOC
Collapse, Amazon Dieback, Permafrost Feedback), social/governance themes (Social Inequality Stress,
Governance Failure Index, Just Transition Failure), and financial/technological themes (Green Swan
Probability, Cyber-Physical Nexus, Supply Chain Fragility) — each independently `sr()`-seeded across
`severity`, `probability`, `velocity`, `interconnection`, `systemicScore`, `contagionRisk`,
`financialImpact`, `mitigationReady` (all 0–100 scale variants), plus categorical `timeHorizon`,
`trendDir`, and `monitorFreq`. A static 15-edge contagion-link list (`CONTAGION`, e.g. "Climate
VaR→Stranded Assets: 85", "Methane Bomb→Tipping Points: 88") and 10 real climate tipping points
(`TIPPING_POINTS`, IPCC-consistent thresholds and proximity %) complete the dataset.

### 7.2 The only live calculations

```js
avg(field) = Σ INDICATORS[field] / 40                              // simple mean, used for all KPIs
critical      = count(systemicScore > 70)
accelerating  = count(trendDir === 'Accelerating')
tippingNear   = count(TIPPING_POINTS.proximity > 60)
catChart[cat] = mean(systemicScore) grouped by category             // 7-category breakdown
radarData[dim] = mean(dim) across all 40 indicators, for 6 dimensions
```

All of these are correct, guard-free (no division-by-zero risk since `INDICATORS.length=40` is a
fixed non-empty constant) unweighted aggregations. There is no cross-indicator correlation, no
network propagation using the `CONTAGION` edge list (it is displayed as a sorted bar chart/table only
— never traversed algorithmically the way the sibling `systemic-climate-risk` module's `NETWORK`
matrix is), and no pillar weighting.

### 7.3 Worked example

Indicator `i=3` ('Green Swan Probability', category 'Financial'): `severity =
round(15+sr(21)×80)`. `sr(21) = frac(sin(22)×10⁴)`; illustratively suppose this yields
`severity≈62`. `systemicScore = round(10+sr(3*19)×85) = round(10+sr(57)×85)`, suppose `≈71` →
exceeds the `>70` critical threshold, so this indicator counts toward `kpis.critical`. Because
`systemicScore` and `severity` are drawn from **different seeds** (`i*19` vs `i*7`), an indicator can
register as "critical" on `systemicScore` while showing only moderate `severity`, or vice versa — the
six displayed risk dimensions per indicator (visible in the expandable detail radar) are not
internally consistent with each other by construction, since none is derived from the others.

### 7.4 Companion analytics

- **Contagion Model tab** — `CONTAGION`'s 15 source→target links (e.g. "Water Scarcity→Agriculture:
  82", "Arctic Ice→Sea Level: 91") are **hand-authored plausible values**, not `sr()`-seeded and not
  derived from any of the 40 indicators' own scores — a descriptive causal-narrative list, not a
  computed adjacency structure.
- **Tipping Points tab** — the 10 `TIPPING_POINTS` entries (AMOC, Amazon Dieback, Arctic Summer Ice,
  Greenland Ice Sheet, West Antarctic, Coral Reef, Permafrost, Boreal Forest, Monsoon, Sahel) with
  their warming thresholds and reversibility flags are accurate, IPCC AR6-consistent reference facts,
  again static rather than computed.
- **36-month trend series** (`TREND`) — `systemicIdx`/`contagion`/`tippingProx` each follow a fixed
  linear drift (`35+i×0.5`, `25+i×0.4`, `20+i×0.6`) plus `sr()` noise — a manufactured upward trend,
  not derived from the 40 indicators' actual time-series (which don't otherwise have history in this
  file).

### 7.5 Data provenance & limitations

- **All 40 indicator scores are `sr()`-seeded synthetic data.** The category taxonomy (7 categories)
  does not match the guide's 3-pillar E/S/G structure, and several "indicators" (AMOC Collapse,
  Antarctic Ice Sheet, Greenland Melt Rate) are pure physical-climate tipping-point themes with no
  E/S/G framing at all — the module blends climate-systemic-risk and ESG-systemic-risk concepts
  under one "Systemic ESG Risk" label without a clear boundary.
- No SERS pillar-weighted composite exists; see §8 for what the guide's formula would require.
- The contagion edge list and 36-month trend are illustrative narrative content, not computed from
  the indicator dataset.

**Framework alignment:** FSB's 2023 ESG Data Report and IOSCO's 2021 ESG Ratings Report are cited as
the guide's basis for a pillar-weighted SERS; the code implements neither pillar tagging nor
weighting. The climate tipping-point thresholds and reversibility classifications are accurate and
consistent with IPCC AR6 WGI Chapter 8/9 tipping-element literature, giving the Tipping Points tab
genuine reference value independent of the SERS gap.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Deliver the guide's intended pillar-weighted Systemic ESG Risk Score (SERS) for macroprudential
supervisors and internal risk committees monitoring correlated ESG-driven financial-system
vulnerabilities, replacing the current flat 40-indicator score list with an auditable E/S/G
decomposition.

### 8.2 Conceptual approach

Adopt a **three-pillar weighted aggregation with a systemic-relevance multiplier**, consistent with
IOSCO's 2021 recommendation that ESG aggregation methodologies disclose pillar weights and rationale,
and benchmarked against **MSCI ESG Ratings' issue-weighting approach** (sector-specific pillar
weights, sub-indicator z-scored before aggregation) adapted from firm-level to system-level scope.

### 8.3 Mathematical specification

```
z_k = (indicator_k − μ_category) / σ_category                 (within-category standardisation)
E_mag = Σ_{k∈Environmental} z_k × relevance_k / Σ relevance_k
S_mag = Σ_{k∈Social} z_k × relevance_k / Σ relevance_k
G_mag = Σ_{k∈Governance} z_k × relevance_k / Σ relevance_k

SERS = 50 + 10×(E_mag×w_E + S_mag×w_S + G_mag×w_G)              (rescaled to a 0-100-centred index)
CorrelatedEventCount = count(indicator pairs with pairwise correlation > 0.6 AND both breaching
                              their systemicScore>70 threshold in the same quarter)
```

| Parameter | Value | Calibration source |
|---|---|---|
| w_E, w_S, w_G | 0.4/0.3/0.3 (starting point) | FSB (2023) notes environmental factors currently dominate systemic ESG discourse; recalibrate via supervisory expert elicitation, document rationale per IOSCO 2021 |
| relevance_k | Sector/theme materiality weight | SASB materiality map, adapted to macro/systemic themes |
| Correlation window | Quarterly | Matches guide's "Correlated ESG Events (YTD)" cadence |
| Standardisation | Within-category z-score | Prevents categories with naturally wider raw-score ranges from dominating the composite |

### 8.4 Data requirements

- Category-consistent E/S/G tagging for every indicator (currently only a 7-category, non-pillar
  taxonomy exists).
- Historical indicator time series (currently only the current-value + `trendDir` label; no true
  history exists to compute realised correlations).
- A relevance/materiality weighting table per indicator (SASB materiality map, free reference).

### 8.5 Validation & benchmarking plan

Backtest `CorrelatedEventCount` against known historical correlated-ESG dislocation episodes (e.g.
2021 EU carbon price spike + stranded-asset repricing); sensitivity-test SERS to ±20% pillar-weight
shifts; reconcile against ESRB's published climate/ESG systemic-risk commentary where qualitatively
comparable.

### 8.6 Limitations & model risk

Z-score standardisation assumes each category's indicator set is large enough for a stable mean/SD —
with only 40 indicators split across 7 categories (5–8 per category), small-sample instability is a
real risk; consider shrinkage toward a cross-category prior. Correlation-based event detection needs
a genuinely long history to avoid spurious co-movement flags — do not deploy `CorrelatedEventCount`
on less than several years of realised indicator time series.
