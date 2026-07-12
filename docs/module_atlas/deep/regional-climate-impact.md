## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most sibling modules, `REGIONS` (21 named world regions × 8 IPCC-style hazard probabilities
+ GDP/agriculture/labor loss figures) is a **hand-curated static dataset**, not `sr()`-seeded —
there is no PRNG anywhere in this file. The only live computation is a single **linear SSP-scenario
multiplier** applied uniformly to every loss metric:

```js
sspMult    = [0.6, 1.0, 1.4, 1.8][sspIndex]                 // SSP1-2.6 / SSP2-4.5 / SSP3-7.0 / SSP5-8.5
gdpImpact_adj    = region.gdpImpact × sspMult
agriLoss_adj     = region.agriLoss  × sspMult
laborLoss_adj    = region.laborLoss × sspMult
avgHazard        = mean(8 hazard probabilities)                                    // simple average, unweighted
priority         = exposure×0.3 + criticality×0.4 + adaptGap×0.3                    // infrastructure tab
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| SSP multipliers | SSP1-2.6: 0.6×, SSP2-4.5: 1.0× (baseline), SSP3-7.0: 1.4×, SSP5-8.5: 1.8× | Synthetic scaling factors — ordinally correct (worse SSP ⇒ larger multiplier on a common baseline) but a single flat multiplier applied identically to GDP, agriculture, and labor loss ignores that these channels respond to warming at different rates and lags in real IAM (integrated assessment model) output |
| `REGIONS` baseline hazard/loss figures (21 regions) | e.g. Pacific Islands `gdpImpact=-8.5%`, coastFlood=0.95; Arctic `gdpImpact=-1.2%`, heatStr=0.08 | Hand-curated — directionally consistent with known climate-vulnerability literature (small island states and South Asia show the largest GDP impacts and heat stress; Northern Europe/Arctic the smallest), but individual figures are not footnoted to a specific IPCC AR6 table row or World Bank dataset in the code itself |
| GDP transmission channel shares | Direct Damage 35%, Supply Chain 25%, Insurance Gap 18%, Fiscal Cost 12%, Productivity Loss 10% | Static illustrative decomposition, sums to 100%, not sourced per-region |
| Infrastructure priority weights | Exposure 30%, Criticality 40%, Adaptation Gap 30% | UI heuristic weighting, unsourced |
| WBGT formula (displayed, not executed) | `WBGT = 0.7×T_wet + 0.2×T_globe + 0.1×T_dry`; Heavy labor 100% loss at WBGT>32°C, Light labor 50% loss at WBGT>35°C | **Correctly quotes the real ISO 7933 WBGT formula** as reference text on the Labor Productivity tab, but `laborLoss` itself is a static per-region constant, not computed by evaluating this formula against any temperature input — the formula is documentation, not code |

### 7.3 Calculation walkthrough

1. **Regional Heatmap tab**: 21×8 hazard-probability matrix, colour-coded (`heatCell`) by
   0.2-wide bands from green (<0.2) to red (>0.8); sortable by any column.
2. **SSP adjustment** (`regionsAdj`): every region's `gdpImpact`/`agriLoss`/`laborLoss` scaled by
   the selected scenario's flat multiplier; hazard *probabilities* themselves (`tropCyc`,
   `rivFlood`, etc.) are **not** scaled by SSP — only the downstream loss figures are, meaning the
   heatmap tab shows constant hazard scores across all 4 scenarios while the GDP/labor tabs vary.
3. **GDP Impact Transmission tab**: static 5-channel decomposition (`gdpTransmission`) shown
   alongside the region ranking — the channels are illustrative shares, not computed per selected
   region or scenario.
4. **Sector-Specific Impacts tab**: 4 sectors (Agriculture, Hydro Power, Tourism, + others) × 4
   regions (SA/SEA/EA/MED), each `baseValue × sspMult` — same flat-multiplier pattern as §7.3.2,
   applied at sector granularity with different static base rates per sector-region pair.
5. **Labor Productivity Loss tab**: bar chart of `laborLoss` (already SSP-scaled) by region,
   colour-banded (>12 red, >8 orange, >4 amber, else green); WBGT formula shown as reference text
   (§7.2) but not evaluated.
6. **Infrastructure Vulnerability tab**: `priority = exposure×0.3 + criticality×0.4 + adaptGap×0.3`
   — a weighted-sum prioritisation score over (presumably) additional static infrastructure asset
   records (fields referenced but not shown in the excerpt reviewed).

### 7.4 Worked example

Pacific Islands region, `SSP3-7.0` selected (`sspMult=1.4`):

| Field | Baseline | ×1.4 (SSP3-7.0) |
|---|---|---|
| `gdpImpact` | −8.5% | **−11.9%** |
| `agriLoss` | 25% | **35.0%** |
| `laborLoss` | 9.5% | **13.3%** |
| `avgHazard` (unscaled) | mean(0.90,0.45,0.95,0.10,0.70,0.40,0.05,0.55) | **0.5125** — unchanged across all 4 SSP tabs |

Note the internal inconsistency: at SSP3-7.0, GDP impact is scaled up 40% but the underlying
hazard-probability average (`avgHazard`, driving the heatmap) stays fixed at 0.51 regardless of
scenario — a genuinely scenario-conditioned hazard model would show wildfire/heat/drought
probabilities themselves rising under a hotter SSP, not just the downstream loss multiplier.

### 7.5 Heatmap colour rubric

| Band | Colour |
|---|---|
| >0.8 | red |
| 0.6–0.8 | orange |
| 0.4–0.6 | yellow |
| 0.2–0.4 | light green |
| <0.2 | green |

### 7.6 Companion analytics

Regional Heatmap (21×8 matrix), Hazard Probability Matrix, GDP Impact Transmission (5-channel
decomposition), Sector-Specific Impacts (4 sectors × 4 regions), Labor Productivity Loss (WBGT
reference + bar chart), Infrastructure Vulnerability (priority-scored asset table).

### 7.7 Data provenance & limitations

- **Regional hazard/loss figures are hand-curated constants**, directionally consistent with
  published climate-vulnerability rankings but not individually source-linked in the code — treat
  as illustrative rather than citable without external verification against IPCC AR6 Table 12.12
  or World Bank Climate Change Portal directly.
- **A single flat multiplier scales all three loss channels identically across scenarios** — real
  NGFS/IPCC scenario transmission is channel- and region-specific (e.g. agriculture responds
  faster to near-term SSP divergence than long-lived infrastructure fiscal costs), which this
  linear-scaling approach does not capture.
- **Hazard probabilities do not vary by SSP scenario** — only downstream loss figures do, an
  internal inconsistency for a tool whose first tab is a scenario-labelled hazard heatmap.
- The WBGT formula is displayed correctly as reference documentation but is disconnected from the
  actual `laborLoss` figures shown in the chart directly below it.

**Framework alignment:** IPCC AR6 WGI Table 12.12 — cited as the guide's data source for
region/peril framing; the code's 21-region × 8-peril structure is consistent with AR6's regional
climate information chapter approach, though individual cell values are not traceable to specific
AR6 table entries · ISO 7933 (WBGT heat-stress standard) — formula correctly quoted, not executed
· World Bank Climate Change Portal — referenced for GDP impact figures, not linked programmatically.
