# Regional Climate Impact Engine
**Module ID:** `regional-climate-impact` · **Route:** `/regional-climate-impact` · **Tier:** B (frontend-computed) · **EP code:** EP-CG2 · **Sprint:** CG

## 1 · Overview
20 regions × 8 perils × 4 SSP scenarios with GDP shock transmission, sector-specific impacts, and labor productivity loss.

**How an analyst works this module:**
- Regional Heatmap shows color-coded risk by region and peril
- GDP Impact Transmission decomposes direct and indirect losses
- Labor Productivity Loss shows WBGT threshold effects by region

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `PERILS`, `REGIONS`, `SSP`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGIONS` | 21 | `tropCyc`, `rivFlood`, `coastFlood`, `wildfire`, `sevStorm`, `drought`, `winStorm`, `heatStr`, `gdpImpact`, `agriLoss`, `laborLoss` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Regional Heatmap','Hazard Probability Matrix','GDP Impact Transmission','Sector-Specific Impacts','Labor Productivity Loss','Infrastructure Vulnerability'];` |
| `SSP` | `['SSP1-2.6','SSP2-4.5','SSP3-7.0','SSP5-8.5'];` |
| `regionsAdj` | `useMemo(() => REGIONS.map(r => ({` |
| `sorted` | `useMemo(() => [...regionsAdj].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : a[sortBy] - b[sortBy]), [regionsAdj, sortBy]);` |
| `top10Gdp` | `[...regionsAdj].sort((a, b) => a.gdpImpact - b.gdpImpact).slice(0, 10);` |
| `laborData` | `regionsAdj.slice(0, 12).map(r => ({ name: r.name.length > 12 ? r.name.slice(0, 12) + '..' : r.name, loss: r.laborLoss }));` |
| `priority` | `d.exposure * 0.3 + d.criticality * 0.4 + d.adaptGap * 0.3;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PERILS`, `REGIONS`, `SSP`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Regions | — | IPCC | Sub-continental resolution |
| Perils | — | IPCC AR6 | TC, flood, wildfire, storm, drought, winter storm, heat, SLR |
| WBGT Productivity Loss | `f(WBGT)` | ISO 7933 | Labor output decline above 25°C WBGT |

## 5 · Intermediate Transformation Logic
**Methodology:** Regional hazard-GDP transmission
**Headline formula:** `GDP_impact = DirectLoss + SupplyChainDisruption + InsuranceGap + FiscalCost`

Each region-peril-SSP combination produces a hazard probability and loss estimate. GDP transmission includes indirect effects through supply chains, uninsured losses, and fiscal response costs. Labor productivity loss calculated via WBGT (ISO 7933).

**Standards:** ['IPCC AR6 WGI Table 12.12', 'World Bank']
**Reference documents:** IPCC AR6 WGI Table 12.12; World Bank Climate Change Portal; ISO 7933 Heat Stress

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Channel-specific scenario response on sourced regional data (analytics ladder: rung 2 → 3)

**What.** The module is honest hand-curation, not PRNG fabrication — 21 regions × 8 hazard probabilities with a live SSP multiplier — but §7.7 lists structural limits: one flat multiplier (0.6/1.0/1.4/1.8) scales GDP, agriculture, and labor losses identically though these channels respond to warming at different rates; hazard probabilities don't vary by SSP even though the first tab is a scenario-labelled hazard heatmap (an internal inconsistency); and the baseline figures are directionally right but not source-linked. Evolution A makes the scenario engine channel- and hazard-specific, with citations.

**How.** (1) Replace the scalar multiplier with a per-channel × per-SSP response matrix (agriculture diverging early, fiscal/infrastructure losses lagging), each row documented against IPCC AR6 WGII regional tables or NGFS damage-function outputs — the platform's NGFS scenario assets are the natural source. (2) Hazard probabilities gain SSP-dependence per peril (heat stress scaling steeply, seismic not at all), fixing the heatmap inconsistency. (3) Wire the displayed-but-disconnected WBGT reference formula into the labor-loss channel: labor productivity loss derived from WBGT threshold exceedance by region and scenario rather than a scaled constant. (4) Source-link each of the 21 regional baselines in a provenance column (AR6 Table 12.12 / World Bank CCKP, as §7.7 itself suggests), served via a small `GET /ref/regional-baselines` endpoint.

**Prerequisites.** The sourcing pass (research effort, not code); NGFS damage-function extraction. **Acceptance:** switching SSP changes the hazard heatmap, not just losses; agriculture and fiscal losses diverge at different rates across scenarios per the documented matrix; every baseline row carries a citation.

### 9.2 Evolution B — Regional-briefing copilot for country/sector questions (LLM tier 1 → 2)

**What.** The module answers "how bad is region X under scenario Y" — a briefing-shaped question. The copilot drafts regional climate-risk briefs: "summarize South Asia's exposure under SSP3-7.0 — dominant perils, GDP transmission channels, labor-productivity impact — for our country-risk committee", grounded in the curated dataset and its new citations, with the transmission decomposition (Direct 35% / Supply Chain 25% / Insurance Gap 18% / Fiscal 12% / Productivity 10%) explained as an illustrative structure where it remains unsourced.

**How.** Tier 1: RAG over this Atlas record and the provenance-annotated regional table; the guardrail is citation fidelity — quantitative claims carry the region row's source, and the copilot distinguishes curated-with-citation from illustrative fields (the §7.2 provenance table is machine-readable for exactly this). Tier 2 after Evolution A: scenario what-ifs call the response-matrix endpoint, and cross-region comparisons are computed rankings, not recalled ones. Cross-module routing: asset-specific questions redirect to `property-physical-risk`/digital-twin modules per the interconnection graph — this module's granularity is regional, and the copilot must say so.

**Prerequisites.** Evolution A's provenance column (a briefing tool without citations invites misuse of illustrative figures); corpus embedding. **Acceptance:** every figure in a brief carries source or "illustrative" labelling matching the provenance column; asset-level questions get the granularity redirect.