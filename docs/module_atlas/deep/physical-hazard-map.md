## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** A **real, well-built backend engine** exists at
> `backend/services/physical_hazard_engine.py` (routes registered under `/api/v1/physical-hazard/*`
> — `score-hazard`, `composite-risk`, `financial-impact`, `crrem-check`, `full-assessment`) that
> implements exactly what the guide describes: IPCC AR6 WG2 + JRC Climate Hazard Atlas-referenced
> country/hazard base scores, RCP-scenario multipliers, honest-null handling when reference data is
> missing, and CRREM stranding-year checks. **The frontend page does not call any of these
> endpoints.** `grep` for `fetch(`/`axios.` in `PhysicalHazardMapPage.jsx` returns no matches — the
> page instead generates its own **independent, uniformly-averaged synthetic dataset** with a
> different peril taxonomy (8 perils, splitting flood into riverine/coastal/pluvial) and a different
> scenario-multiplier table (5 SSP/current bands) than the backend engine's 7-hazard,
> weighted-composite (`COMPOSITE_WEIGHTS`) design. This is a "correct engine, unused" pattern rather
> than a "no real model" pattern — §7 documents both; §8 recommends wiring instead of building anew.

### 7.1 What the frontend actually computes

```js
hazardScores[perilId] = round(sr(i*7 + PERILS.indexOf(peril)) × 85 + 10)     // 10–95, independent per peril
composite              = round(Σ hazardScores / PERILS.length)                // simple unweighted mean
avgComposite            = round(mean(filteredAssets.composite) × scenarioMult)
```

40 synthetic assets are generated across 15 countries and 6 asset classes; each of 8 perils gets an
independent random score, and the composite is a **plain arithmetic mean** — not the guide's stated
`H = Σ(wᵢ×perilᵢ)/Σwᵢ` weighted aggregation.

### 7.2 What the backend engine actually computes (unused by this page)

```python
composite_hazard_score = Σ(score_h × weight_h) / Σ(weight_h used)   # renormalises over available hazards only
```

| Hazard | Weight | Data source cited |
|---|---|---|
| Flood | 0.20 | JRC_EFAS_Global + WRI_Aqueduct_4.0 |
| Heat stress | 0.20 | IPCC_AR6_Atlas + ERA5 |
| Wildfire | 0.15 | JRC_GWIS + Copernicus_EFFIS |
| Sea level rise | 0.15 | IPCC_AR6_SLR + CoastalDEM |
| Cyclone | 0.15 | IBTrACS + CMIP6 |
| Drought | 0.10 | SPEI_Global_DB + CRU_TS4 |
| Subsidence | 0.05 | InSAR_Global + Peat_Depth_Atlas |

The engine's `score_hazard()` looks up a country/hazard base score from a real-country-profile table
(`COUNTRY_BASE_HAZARD`, 15 countries with hazard-specific 0–100 scores — e.g. Bangladesh flood=90,
Australia wildfire=80), applies an RCP scenario multiplier (1.0–2.2 by hazard and RCP band) and a
time-horizon amplification factor, and — critically — **returns an honest `null` with
`source="insufficient_data"` when neither a reference-data entry nor a caller override exists**,
rather than fabricating a neutral-prior number. This null-propagates through
`compute_composite_risk` (renormalises weights over only the hazards actually scored) and
`estimate_financial_impact` (returns a full `insufficient_data` payload rather than a fake dollar
figure) — a deliberately conservative, audit-friendly design.

### 7.3 Frontend calculation walkthrough

1. **Asset generation**: 40 assets, each drawing all 8 peril scores independently
   (`sr(i*7+perilIndex)`) — no country-base-hazard lookup, so e.g. a Bangladesh asset and a Germany
   asset have statistically identical flood-risk distributions, which is physically wrong (the
   backend engine's `COUNTRY_BASE_HAZARD` table correctly differentiates these).
2. **Scenario multiplier**: `SCENARIOS` (5 bands: Current→1.00, SSP1-2.6→1.15, SSP2-4.5→1.35,
   SSP5-8.5(2050)→1.68, SSP5-8.5(2100)→2.42) scales the composite and per-peril/country/radar
   aggregates uniformly — this is a genuine scenario-stress mechanic, just applied on top of
   unweighted, non-country-differentiated base scores.
3. **Composite/risk tier**: `composite > 65 → High`, `> 40 → Medium`, else `Low` — a simple
   threshold rubric distinct from the backend's 5-tier `RISK_TIERS` (critical/high/medium/low/
   negligible at 75/55/35/15/0).
4. **CRREM alignment**: the backend's `check_crrem_alignment()` (stranding-year lookup by asset type
   and RCP scenario, e.g. office building RCP8.5→2035) has no corresponding call or logic in this
   page at all.

### 7.4 Worked example (frontend, as actually shown to users)

Asset index `i=8`, SSP5-8.5 (2050) scenario (`mult=1.68`):

| Peril | `sr(8×7 + perilIdx)×85+10` | Illustrative result |
|---|---|---|
| Riverine flood (idx 0) | sr(56)×85+10 | e.g. 52 |
| Wildfire (idx 3) | sr(59)×85+10 | e.g. 71 |
| Extreme heat (idx 4) | sr(60)×85+10 | e.g. 38 |
| Composite (unweighted mean of 8) | (52+…+38+…)/8 | e.g. 55 |
| Scenario-adjusted composite | 55 × 1.68 | **92.4** (capped at 100 in downstream display logic elsewhere) |

There is no path in the visible code from this number to a dollar-denominated property-damage or
adaptation-CAPEX estimate — that logic exists only in the unused backend
`estimate_financial_impact()`.

### 7.5 Data provenance & limitations

- **Frontend hazard scores are pure `sr()`-seeded synthetic data**, not country- or asset-type
  differentiated, despite the country/asset-class filters implying that differentiation exists.
- **A correctly-designed backend engine with honest-null handling, weighted composite scoring, and
  CRREM alignment sits unused** — this is the highest-value integration gap found in this module: no
  new model needs to be designed, it needs to be *wired up*.
- The frontend's 8-peril taxonomy (splitting flood into riverine/coastal/pluvial) doesn't map
  1:1 onto the backend's 7-hazard taxonomy (single "flood" category) — reconciling them requires a
  taxonomy decision, not just an API call.

**Framework alignment:** IPCC AR6 WG2 and JRC Climate Hazard Atlas are genuinely implemented — in
the backend engine, which this page doesn't call. The page's own SSP-scenario labelling (SSP1-2.6,
SSP2-4.5, SSP5-8.5) is directionally correct IPCC terminology, applied as a uniform multiplier rather
than the engine's hazard-specific RCP multiplier table.

## 8 · Model Specification

**Status: specification — not yet implemented as the data source for this page (a compliant engine
already exists in the backend and should be wired in rather than re-specified from scratch).**

### 8.1 Purpose & scope
Serve country/asset-type-differentiated, weighted-composite physical hazard scores with honest
missing-data handling to the frontend hazard map, replacing the current uniform-random,
unweighted-mean placeholder.

### 8.2 Conceptual approach
Wire `PhysicalHazardMapPage.jsx` to `POST /api/v1/physical-hazard/full-assessment` per asset (or a
batched variant), replacing the local `ASSETS` generator. This mirrors how BlackRock Aladdin Climate
and MSCI Climate VaR separate a "hazard data service" (the engine) from "portfolio view" (the UI) —
the engine here is already benchmark-consistent (weighted composite renormalised over available
hazards, honest nulls) and doesn't need re-design, only integration.

### 8.3 Mathematical specification (already implemented in the engine — restated for reference)
See §7.2's weighted-composite formula and `COMPOSITE_WEIGHTS` table; no new maths required. The one
gap to close: the frontend's 3-way flood split (riverine/coastal/pluvial) needs either (a) collapsing
to the engine's single `flood` hazard, or (b) extending `HAZARD_PROFILES`/`COUNTRY_BASE_HAZARD` in
the engine to carry the 3-way split, whichever preserves more information for underwriting use.

### 8.4 Data requirements
Already met by the engine's static reference tables (`COUNTRY_BASE_HAZARD`, `ASSET_VULNERABILITY`,
`CRREM_STRANDING_YEARS`). To go beyond illustrative country-level scores, source real site-level
raster lookups (JRC EFAS, WRI Aqueduct 4.0 API, JRC GWIS) keyed by asset lat/long — the engine's
`base_hazard_override` parameter already supports injecting such a value when available.

### 8.5 Validation & benchmarking plan
Once wired, reconcile country-level base hazard scores against WRI Aqueduct's own published country
rankings and IPCC AR6 Atlas regional summaries; unit-test that `missing_hazards` renormalisation in
`compute_composite_risk` behaves correctly at the frontend layer (no silent zero-fill).

### 8.6 Limitations & model risk
Even once wired, the engine's country-level base hazard is a coarse proxy for site-level risk — a
production deployment should prioritise the `base_hazard_override` path with real gridded-raster
lookups over the static country table for material single-asset underwriting decisions.
