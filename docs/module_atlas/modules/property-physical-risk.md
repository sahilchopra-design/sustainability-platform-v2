# Property Physical Risk
**Module ID:** `property-physical-risk` · **Route:** `/property-physical-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses climate physical hazard risk for real estate assets, integrating CRREM stranding analysis and multi-peril exposure modelling.

> **Business value:** Equips real estate managers and lenders with CRREM-aligned stranding analysis and multi-peril hazard scores to manage physical climate risk in property portfolios.

**How an analyst works this module:**
- Upload asset register with location and EPC data.
- Run CRREM stranding analysis against target pathway.
- Overlay physical hazard scores (flood, heat, SLR).
- Prioritise capex for at-risk assets and model retrofit scenarios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ADAPTATION_MEASURES`, `Grid`, `HAZARDS`, `HORIZON_OPTIONS`, `KpiCard`, `SSP_OPTIONS`, `Section`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `HAZARDS` | 7 | `name`, `icon`, `type`, `color` |
| `SSP_OPTIONS` | 4 | `label`, `multiplier`, `desc` |
| `HORIZON_OPTIONS` | 4 | `label`, `multiplier` |
| `ADAPTATION_MEASURES` | 9 | `name`, `cost_usd_mn`, `risk_reduction_pct`, `applicable` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtUsd` | `(v) => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : `$${v}`;` |
| `clamped` | `Math.min(100, Math.max(0, Number(value) \|\| 0));` |
| `val` | `Math.min(100, raw * sspMult * horizonMult);` |
| `composite` | `HAZARDS.reduce((s, h) => s + (adjusted[h.id] \|\| 0), 0) / HAZARDS.length;` |
| `acuteAvg` | `acuteCount > 0 ? acuteSum / acuteCount : 0;` |
| `chronicAvg` | `chronicCount > 0 ? chronicSum / chronicCount : 0;` |
| `compoundFloodSea` | `Math.min(100, (adjusted.flood \|\| 0) * 0.4 + (adjusted.sealevel \|\| 0) * 0.35 + (adjusted.cyclone \|\| 0) * 0.25);` |
| `insuranceMult` | `1 + composite / 100;` |
| `climateAdjPremium` | `basePremium * insuranceMult;` |
| `resilience` | `p.building_resilience_score \|\| (50 + Math.round((sr(idx) * 2 - 1) * 20));` |
| `composites` | `enriched.map(p => p.composite);` |
| `avgComposite` | `composites.reduce((a, b) => a + b, 0) / composites.length;` |
| `mostExposed` | `enriched.reduce((a, b) => a.composite > b.composite ? a : b);` |
| `avgPremium` | `enriched.reduce((s, p) => s + (p.insurance_premium_usd \|\| 50000), 0) / enriched.length;` |
| `totalVaR` | `enriched.reduce((s, p) => s + (p.composite / 100) * (p.gav_usd \|\| p.value_usd \|\| 50e6) * 0.15, 0);` |
| `highFloodZones` | `(floodZoneCounts['A'] \|\| 0) + (floodZoneCounts['AE'] \|\| 0) + (floodZoneCounts['V'] \|\| 0);` |
| `avgResilience` | `enriched.reduce((s, p) => s + p.resilience, 0) / enriched.length;` |
| `totalAdaptCost` | `enriched.reduce((s, p) => {` |
| `avgElevation` | `enriched.reduce((s, p) => s + (p.elevation_m \|\| 25), 0) / enriched.length;` |
| `barData` | `useMemo(() => { return [...enriched].sort((a, b) => b.composite - a.composite).map(p => ({ name: (p.name \|\| `Property ${p.idx + 1}`).substring(0, 18), composite: Math.round(p.composite * 10) / 10, tier: p.tier, }));` |
| `totalGAV` | `enriched.reduce((s, p) => s + (p.gav_usd \|\| p.value_usd \|\| 50e6), 0);` |
| `avgRisk245` | `enriched.reduce((s, p) => s + p.composite, 0) / enriched.length / 100;` |
| `discount245` | `avgRisk245 * 0.15 * t * 1.0;` |
| `discount585` | `avgRisk245 * 0.15 * t * 1.4;` |
| `topHazard` | `m.applicable.reduce((best, h) => (selected.adjusted[h] \|\| 0) > (selected.adjusted[best] \|\| 0) ? h : best, m.applicable[0]);` |
| `reducedScore` | `currentScore * (1 - m.risk_reduction_pct / 100);` |
| `annualSaving` | `(currentScore - reducedScore) / 100 * (selected.gav_usd \|\| selected.value_usd \|\| 50e6) * 0.002;` |
| `payback` | `annualSaving > 0 ? (m.cost_usd_mn * 1e6) / annualSaving : 99;` |
| `hdr` | `['Property','Type','Location','Composite',...HAZARDS.map(h=>h.name),'Resilience','Insurance Premium','Flood Zone'].join(',');` |
| `rows` | `enriched.map(p => [` |
| `blob` | `new Blob([hdr+'\n'+rows.join('\n')], { type:'text/csv' });` |
| `annualInc` | `adjPrem - basePrem;` |
| `tenYrCost` | `annualInc * 10;` |
| `avgVal` | `enriched.reduce((s, p) => s + (p.adjusted[h.id] \|\| 0), 0) / enriched.length;` |
| `maxProp` | `enriched.reduce((a, b) => (a.adjusted[h.id] \|\| 0) > (b.adjusted[h.id] \|\| 0) ? a : b);` |
| `totalBase` | `enriched.reduce((s, p) => s + (p.insurance_premium_usd \|\| 50000), 0);` |
| `avgMult` | `enriched.reduce((s, p) => s + p.insuranceMult, 0) / enriched.length;` |
| `tMult` | `1 + (y - 2030) / 70 * 0.8;` |
| `totalCost` | `applicableProps.length * m.cost_usd_mn;` |
| `avgA` | `a[1].reduce((s, p) => s + p.composite, 0) / a[1].length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADAPTATION_MEASURES`, `HAZARDS`, `HORIZON_OPTIONS`, `SSP_OPTIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Avg Stranding Year | — | CRREM Engine | Asset-value-weighted mean stranding year for real estate portfolio under 1.5°C pathway. |
| High Physical Hazard Assets (%) | — | Hazard Mapping | Share of portfolio by value with high or extreme composite physical hazard score. |
| Avg EUI (kWh/m²/yr) | — | Energy Audit Data | Portfolio weighted average energy use intensity from asset energy performance certificates. |
- **Asset register + EPC data + CRREM pathways + hazard rasters** → Stranding year calculation; hazard overlay; capex scenario modelling → **Asset-level stranding risk report and capex prioritisation output**

## 5 · Intermediate Transformation Logic
**Methodology:** Stranding Year
**Headline formula:** `Strand = min{t : EUI(t) > CRREM_pathway(t)}`

Earliest year in which asset energy use intensity exceeds the CRREM carbon intensity pathway, triggering stranded asset risk.

**Standards:** ['CRREM Global Pathways v2', 'JLL Physical Risk Framework']
**Reference documents:** CRREM Global Pathways v2 (2023); TCFD Guidance for Real Estate Sector; JLL Climate Risk Assessment Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide headlines a **CRREM stranding-year** model
> `Strand = min{t : EUI(t) > CRREM_pathway(t)}` with a "portfolio avg stranding year 2031" and "avg
> EUI 182 kWh/m²/yr". **No stranding, EUI, or CRREM-pathway logic exists in this module.** (CRREM
> lives in the separate `/crrem` route, which this page even links to for portfolio seeding.) What
> this module actually implements is a **multi-peril physical-hazard exposure engine**: six hazards
> scaled by SSP × time-horizon multipliers, reduced by adaptation measures, aggregated to a composite,
> then translated into a climate-adjusted insurance premium and a portfolio Value-at-Risk. Sections
> below document the code.

### 7.1 What the module computes

The page consumes an **externally-seeded RE portfolio** from `localStorage['ra_re_portfolio_v1']`
(produced by the CRREM module); each property carries a `physicalRisk` object with per-hazard scores.
Per hazard `h` and property:

```js
raw  = override[h] ?? physicalRisk[h] ?? 0                       // 0–100 base hazard score
val  = min(100, raw × sspMult × horizonMult)                    // scenario + horizon scaling
for each active adaptation applicable to h:
       val = val × (1 − risk_reduction_pct/100)                 // multiplicative mitigation
adjusted[h] = clamp(val, 0, 100)

composite     = Σ_h adjusted[h] / 6                             // simple mean of 6 hazards
acuteAvg      = mean(adjusted over Acute hazards)               // flood, cyclone, wildfire
chronicAvg    = mean(adjusted over Chronic hazards)             // heat, drought, sea level
compoundFloodSea = min(100, 0.4·flood + 0.35·sealevel + 0.25·cyclone)
```

**Insurance repricing & VaR:**

```js
insuranceMult      = 1 + composite/100                          // up to 2× at composite=100
climateAdjPremium  = basePremium × insuranceMult
totalVaR           = Σ (composite/100) × GAV × 0.15             // 15% max-loss anchor × hazard fraction
```

**Portfolio-discount scenarios** (value-erosion tab): `discount = avgRisk × 0.15 × t × ssp_factor`
where `ssp_factor` = 1.0 (SSP2-4.5) or 1.4 (SSP5-8.5), `t` a time index — value = `GAV × (1 − discount)`.

### 7.2 Parameterisation / provenance

| Parameter | Value | Provenance |
|---|---|---|
| SSP multipliers | 0.8 / 1.0 / 1.4 (SSP1-2.6 / 2-4.5 / 5-8.5) | in-code (IPCC SSP-RCP ordering; values heuristic) |
| Horizon multipliers | 1.0 / 1.3 / 1.8 (2030 / 2050 / 2100) | in-code heuristic (rising hazard over time) |
| Compound flood weights | 0.40 / 0.35 / 0.25 | in-code heuristic |
| VaR loss anchor | 15% of GAV at full hazard | in-code (single scalar; not peril-specific) |
| Adaptation cost / reduction | e.g. Seawall $2.5M / −45% | hand-authored measure table (8 measures) |
| Resilience (if missing) | `50 + (sr(idx)·2−1)·20` | **synthetic fallback** (40–70) |
| Hazard base scores | from seeded RE portfolio | inherited (synthetic upstream) |

The **only in-module `sr()`** is the resilience fallback when a property lacks
`building_resilience_score`; hazard scores themselves originate in the upstream portfolio.

### 7.3 Calculation walkthrough

1. Load portfolio; if absent, prompt user to seed via CRREM.
2. For each property, apply SSP × horizon scaling to each hazard, then adaptation reductions.
3. Composite = mean of 6 adjusted hazards → risk tier (≥70 Critical, ≥50 High, ≥30 Medium, else Low).
4. Insurance premium scaled by `1 + composite/100`; VaR = hazard fraction × GAV × 15%.
5. Adaptation tab: per measure, `reducedScore = current × (1 − reduction%)`, annual saving =
   `(current − reduced)/100 × GAV × 0.002`, payback = `cost / annualSaving`.

### 7.4 Worked example (one property, SSP5-8.5 @ 2050)

Base hazard scores flood 60, cyclone 30, wildfire 20, heat 50, drought 40, sealevel 45; GAV $80M;
base premium $120k; SSP mult 1.4, horizon mult 1.3 (→ combined ×1.82); no adaptations.

| Hazard | raw | ×1.82 (cap 100) |
|---|---|---|
| flood | 60 | 100 (capped) |
| cyclone | 30 | 54.6 |
| wildfire | 20 | 36.4 |
| heat | 50 | 91.0 |
| drought | 40 | 72.8 |
| sealevel | 45 | 81.9 |

`composite = (100+54.6+36.4+91.0+72.8+81.9)/6 = 72.8` → **Critical**.
`insuranceMult = 1 + 0.728 = 1.728` → premium `$120k × 1.728 = $207k`.
`VaR = 0.728 × $80M × 0.15 = $8.74M`. Adding a Seawall (−45% on flood & sealevel) drops those two
hazards, lowering composite and premium — the adaptation payback tab quantifies the trade.

### 7.5 Data provenance & limitations

- **Hazard scores are inherited from a synthetic upstream portfolio**; the only in-page `sr()` is the
  resilience fallback. There is no live hazard raster, catalogue, or return-period loss curve.
- **No CRREM stranding, no EUI, no transition/carbon-pathway** — the guide's central methodology is
  absent from this route (it exists in `/crrem`).
- The 15% VaR anchor is a **single scalar applied to all perils and all severities** — not a
  probabilistic loss distribution; it is `E[loss] ≈ hazard% × GAV × 15%`, a crude expected-damage
  proxy, not a percentile VaR.
- SSP and horizon multipliers are flat scalars, not hazard-specific damage functions; a flood score
  and a heat score scale identically with warming, which is physically wrong (heat rises faster).
- Adaptation reductions are multiplicative constants, independent of severity.

**Framework alignment:** The module references **IPCC SSP-RCP scenarios** (SSP1-2.6 / 2-4.5 / 5-8.5,
correctly ordered by forcing), the **acute/chronic hazard taxonomy** from **TCFD** (flood/cyclone/
wildfire acute; heat/drought/sea-level chronic — correctly classified), and (via the guide) **CRREM
Global Pathways** and **JLL** physical-risk framing. CRREM derives a stranding year by comparing an
asset's carbon-intensity trajectory to a science-based 1.5 °C decarbonisation pathway — that logic is
in the CRREM module, not here. A production physical-risk model needs §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce, per property and portfolio, a probabilistic climate physical-risk
loss (expected annual loss and tail VaR) and a climate-adjusted insurance premium, under SSP-RCP
scenarios and time horizons. Coverage: any RE asset with location, GAV, and construction attributes.

**8.2 Conceptual approach.** A **hazard × exposure × vulnerability damage-function model**, mirroring
(i) Munich Re / Swiss Re CatNet and (ii) Moody's/427 and Jupiter Intelligence asset-level physical
risk. Each peril has its own hazard-intensity distribution (from downscaled climate projections), a
depth/intensity-damage function, and asset vulnerability — the standard cat-model structure, not a
single 15% scalar.

**8.3 Mathematical specification.**
Per peril k: annual exceedance-probability curve `EP_k(loss)` from
`loss = GAV × DF_k(intensity) × V_asset`, `DF_k` a peril-specific damage function (e.g. flood
depth-damage). Expected annual loss `EAL = Σ_k ∫ loss · dEP_k`. Portfolio VaR at p:
`VaR_p = quantile_p(Σ_k loss_k)` via Monte Carlo over correlated peril intensities.
Scenario/horizon shift hazard distributions: `intensity_{s,t} = intensity_base × Δ_{k,s,t}`
(peril-, scenario-, horizon-specific, from climate projections — replaces the flat SSP×horizon scalar).
Premium: `premium = EAL × (1 + loading) + capitalCharge(VaR)`.

| Parameter | Symbol | Calibration source |
|---|---|---|
| Damage functions | `DF_k` | JRC/FEMA HAZUS flood depth-damage; wind/wildfire curves |
| Hazard shift | `Δ_{k,s,t}` | CMIP6 downscaled SSP1-2.6/2-4.5/5-8.5 projections |
| Vulnerability | `V_asset` | construction type, age, elevation (ND-GAIN / engineering) |
| Peril correlation | ρ | historical multi-peril co-occurrence (EM-DAT, Swiss Re sigma) |
| Insurance loading | loading | market cat-loading benchmarks |

**8.4 Data requirements.** Per asset: geocode, GAV, floor area, construction type, age, elevation,
flood zone. Hazard layers: CMIP6/WRI Aqueduct flood, wildfire, cyclone, heat. Sources: Aqueduct,
NASA NEX-GDDP, EM-DAT. Platform holds seeded RE portfolio + hazard scores; needs real hazard rasters
and damage functions.

**8.5 Validation & benchmarking.** Backtest EAL against historical property claims; reconcile VaR
against vendor cat-model output (Moody's 427, Jupiter); sensitivity to damage-function choice and
scenario; stability of premium uplift vs reinsurance benchmarks.

**8.6 Limitations & model risk.** Damage functions are the dominant uncertainty; downscaled climate
projections carry large model spread → report EAL/VaR as ranges across climate models. Conservative
fallback: where asset attributes are missing, use construction-class median vulnerability and flag
low confidence; never present a single-scalar VaR as a percentile.

## 9 · Future Evolution

### 9.1 Evolution A — Digital-twin hazard resolution and hazard-specific damage functions (analytics ladder: rung 2 → 3)

**What.** The module is a genuine multi-peril exposure calculator (SSP × horizon scaling, adaptation reductions, composite → premium/VaR), but §7.5 lists physical wrongness it should shed: hazard scores are inherited from a synthetic upstream portfolio (no live raster), the "VaR" is a flat `hazard% × GAV × 15%` scalar, and SSP/horizon multipliers scale flood and heat identically — "physically wrong (heat rises faster)". Evolution A grounds it in the platform's own Physical Risk Digital Twin: per-coordinate lookups against the five populated `ref_*_zones` PostGIS grids (earthquake/cyclone/wildfire/flood/sea-level), and per-hazard scenario response curves replacing the flat multipliers.

**How.** (1) Property enrichment calls the existing `global_physical_risk_engine` composite-scoring endpoint with each asset's lat/lon, replacing `localStorage` hazard inheritance; `resolution_tier` reported per the GLEIF-style cascade, and the in-page `sr()` resilience fallback retired for an honest null. (2) Per-hazard SSP multiplier table (heat scaling steeper than flood, sea-level horizon-dependent) documented with IPCC AR6 basis and served via a `ref/` endpoint. (3) The 15% anchor becomes per-peril damage ratios at score bands — still deterministic, but peril-differentiated and cited; label changes from "VaR" to "expected damage proxy" until a loss distribution exists.

**Prerequisites.** Flood/sea-level grids upgraded from sparse coverage (48/152 rows today per platform state) or coarse-tier flagging where empty; CRREM-module portfolio handshake preserved. **Acceptance:** two properties in different hazard zones produce different composites from coordinates alone; heat and flood scores diverge across SSPs per the documented curves.

### 9.2 Evolution B — Portfolio risk-review copilot with adaptation what-ifs (LLM tier 2)

**What.** A copilot for RE managers and lenders working the capex-prioritisation question this module already frames: "which five assets drive our climate-adjusted premium, and what's the cheapest adaptation package that moves them out of the high tier?" — answered by reading the enriched portfolio and running the module's own adaptation mechanics (9 `ADAPTATION_MEASURES` with cost and risk-reduction %, payback = cost / annual premium saving) as tool-called what-ifs rather than narrative guesses.

**How.** After Evolution A moves computation server-side, expose `POST /portfolio-risk` and `POST /adaptation-scenario`; tier-2 tool schemas from those operations. System prompt embeds §7.5's caveats — the copilot must distinguish the expected-damage proxy from a percentile VaR when lenders ask, and must not answer CRREM/stranding questions (the §7 flag notes that methodology lives in `/crrem`; the copilot routes there instead, using the atlas interconnection data). Adaptation recommendations ranked strictly by computed payback, each citing its measure row.

**Prerequisites.** Evolution A endpoints; digital-twin coverage tiers surfaced so the copilot can caveat coarse-resolution assets. **Acceptance:** every premium and payback figure traces to a tool call; a stranding-year question receives a redirect to the CRREM module, not an invented year.