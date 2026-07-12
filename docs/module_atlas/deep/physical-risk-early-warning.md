## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** MODULE_GUIDES states alert severity is computed as
> `Alert = HazardIntensity > Threshold(asset_type, peril)`, with CRITICAL/HIGH/MEDIUM/LOW mapped to
> p99/p95/p90/p75 intensity percentiles. **No threshold comparison, percentile calculation, or
> hazard-intensity value exists in the code.** The `computed` extraction for this module is **empty**
> — the entire page is a static, hand-authored seed table (`ALERTS`, 13 rows) where each alert's
> `sev` field is a literal hard-coded string. There is no live hazard feed, no forecast-ensemble
> ingestion, and no percentile-threshold logic anywhere in the page. Sections below document the
> code as it behaves; §8 specifies the real threshold-based alerting system the guide describes.

### 7.1 What the module computes

The page is almost entirely declarative seed data plus display-layer aggregation:

```js
counts.CRITICAL = ALERTS.filter(a => a.sev === 'CRITICAL').length     // tally of hard-coded severities
// no formula anywhere derives `sev` from a hazard intensity value
```

Three static tables drive the whole page:
- `ALERTS` (13 rows): `sev` (hard-coded CRITICAL/HIGH/MEDIUM/LOW string), hazard, region, asset
  count, loss range (a pre-written string like "$180-320M"), status, timestamp text ("4 min ago"),
  and a narrative `detail` string.
- `FORECAST_EVENTS` (8 rows): event name, probability %, impact tier, affected asset count — all
  literal values, e.g. "Hurricane approach — Gulf of Mexico, prob:92, impact:CRITICAL".
- `HISTORICAL` (21 rows): named past events with `actualLoss`, `modelledLoss`, and `ratio` —
  the one place a genuine derived quantity *could* live (`ratio = modelledLoss/actualLoss`), though
  even this is stored as a literal seed field rather than computed from the two loss figures at
  render time.

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| `sev` per alert | hard-coded string | Not derived from any threshold rule |
| `lossRange` | hard-coded string (e.g. "$180-320M") | Not computed from asset value × damage function |
| `HISTORICAL.ratio` | hard-coded per row | Not computed as `modelledLoss/actualLoss` at render time, even though both inputs are present in the same row |
| Response protocol thresholds (footer text: "CRITICAL = immediate \| HIGH = within 15 min \| MEDIUM = hourly digest \| LOW = daily summary") | descriptive text only | No code enforces these SLAs against a timestamp or hazard value |

### 7.3 Calculation walkthrough

1. **Alert dashboard**: `counts` object tallies `ALERTS` by the literal `sev` field — the *only*
   real aggregation in the page, and it operates on pre-assigned labels, not derived intensities.
2. **72-hour forecast**: a stacked-area chart uses `critical: Math.floor(1 + sr(i*23+10)*3)` — the
   *chart's* forecast counts are randomly generated per time bucket, unrelated to the 8 named
   `FORECAST_EVENTS` shown in a separate list.
3. **Historical event library**: displays `actualLoss` vs `modelledLoss` side by side with the
   pre-computed `ratio`; a user can visually compare the two columns, but the page performs no
   independent recomputation or validation of the stored ratio.
4. **Response protocol**: static text blocks per severity tier, not wired to any live countdown or
   SLA-tracking logic.

### 7.4 Worked example

There is no worked-example arithmetic to trace: `ALERTS[0] = { sev:'CRITICAL', hazard:'Tropical
Cyclone', region:'Gulf of Mexico', assets:5, lossRange:'$180-320M', ... }` is displayed verbatim.
Nothing in the page computes 180–320 from an asset schedule, wind-speed intensity, or damage curve.

### 7.5 Data provenance & limitations

- **The entire module is static seed content** — no live NOAA/ECMWF feed, no percentile-threshold
  computation, no linkage between the "72-hour forecast" chart (randomly generated) and the
  "Forecast Events" list (hand-authored).
- This is a **UI mockup of a real-time alerting system**, not a working alert-generation pipeline —
  useful for demonstrating the intended UX, but it cannot actually flag new events from live hazard
  data.
- The `HISTORICAL.ratio` field, despite sitting next to both loss figures it should be derived from,
  is stored rather than computed — a latent-inconsistency risk if the two source figures are ever
  edited independently.

**Framework alignment:** the guide cites NOAA severe-weather alerts, ECMWF ensemble forecasts, and
EM-DAT as data sources and a p99/p95/p90/p75 severity convention — none of this is implemented; the
module should be understood as a **wireframe/prototype** for the alerting feature described in the
guide, not a functioning implementation of it.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Generate real-time, severity-tiered physical-hazard alerts for portfolio assets from live weather/
hazard feeds, supporting operational risk response (evacuation, hedging, claims pre-positioning) —
the decision context the guide's `userInteraction` list describes. Mirrors how catastrophe-model
vendors (RMS, Verisk/AIR, CoreLogic) and reinsurers' internal "nowcast" systems flag imminent
event exposure against a bound book of business.

### 8.2 Conceptual approach
**Percentile-threshold alerting** against a portfolio-specific historical hazard-intensity
distribution, following the convention the guide already specifies (p99/p95/p90/p75), combined with
ensemble-forecast probability weighting — this mirrors **ECMWF's own ensemble-probability alert
tiers** and how **Swiss Re CatNet** and **NOAA/NWS impact-based warnings** grade severity by
exceedance probability rather than a single deterministic forecast value.

### 8.3 Mathematical specification

```
Threshold_p(asset_type, peril) = p-th percentile of the peril's local historical intensity distribution
                                   (fit per grid cell / region from a multi-decade reanalysis series)

Severity(event) =
  CRITICAL  if Intensity_forecast > Threshold_p99
  HIGH      if Intensity_forecast > Threshold_p95
  MEDIUM    if Intensity_forecast > Threshold_p90
  LOW       if Intensity_forecast > Threshold_p75
  none      otherwise

AssetsAtRisk = { a ∈ Portfolio : distance(a, event_track) < impact_radius(peril, intensity) }
LossRange    = [P10, P90] of a peril-specific damage-function Monte Carlo over AssetsAtRisk exposure values
```

| Parameter | Calibration source |
|---|---|
| Historical intensity percentiles | ERA5/NOAA multi-decade reanalysis, per-peril per-grid-cell |
| Ensemble forecast | ECMWF ENS (51-member) or NOAA GEFS probability-weighted track/intensity |
| Impact radius by peril | NOAA hurricane wind-radius climatology (cyclone); JBA/Fathom flood extent (flood) |
| Damage function | FEMA HAZUS-MH (US) or Swiss Re/Munich Re NatCat vulnerability curves |

### 8.4 Data requirements
Live feeds: NOAA NHC/ECMWF track+intensity forecasts, EM-DAT for historical-event backtesting,
portfolio asset geocodes + insured values (already exist in-platform for other risk modules, e.g.
`physical-hazard-map`'s `ASSETS`). None of the live-feed ingestion currently exists in the platform.

### 8.5 Validation & benchmarking plan
Backtest the `HISTORICAL` table's `actualLoss` vs `modelledLoss` ratio properly (compute it live
from the two stored figures rather than storing a third, inconsistency-prone field); target a
modelled/actual ratio band of 0.7–1.3× as a reasonable catastrophe-model calibration bar, consistent
with industry cat-model back-test tolerances.

### 8.6 Limitations & model risk
Percentile thresholds fit on short historical windows will understate tail risk for climate
non-stationarity (a threshold fit on 1990–2020 data will be miscalibrated for 2030+ conditions) —
recommend periodic threshold re-fitting against a rolling window, and flag when live intensity
exceeds the *training* window's own maximum (true out-of-sample tail event).
