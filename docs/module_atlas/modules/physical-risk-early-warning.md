# Physical Risk Early Warning
**Module ID:** `physical-risk-early-warning` · **Route:** `/physical-risk-early-warning` · **Tier:** B (frontend-computed) · **EP code:** EP-CG4 · **Sprint:** CG

## 1 · Overview
Real-time alert system with 12 active alerts, 72-hour forecast, historical event library, and response protocols.

**How an analyst works this module:**
- Alert Dashboard shows severity-coded active alerts
- 72hr Forecast panel overlays weather events on portfolio assets
- Historical Event Library compares modelled vs actual losses
- Response Protocol provides action items by severity level

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `FORECAST_EVENTS`, `HISTORICAL`, `PROTOCOLS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ALERTS` | 13 | `sev`, `hazard`, `region`, `assets`, `lossRange`, `status`, `ts`, `detail` |
| `FORECAST_EVENTS` | 8 | `event`, `prob`, `impact`, `assets` |
| `HISTORICAL` | 21 | `event`, `region`, `type`, `actualLoss`, `modelledLoss`, `ratio` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERTS`, `FORECAST_EVENTS`, `HISTORICAL`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Alerts | — | Simulated | Current portfolio exposure alerts |
| Forecast Horizon | — | ECMWF | Short-range weather forecast for asset locations |

## 5 · Intermediate Transformation Logic
**Methodology:** Threshold-based alert generation
**Headline formula:** `Alert = HazardIntensity > Threshold(asset_type, peril)`

Severity levels: CRITICAL (>p99 intensity), HIGH (>p95), MEDIUM (>p90), LOW (>p75). 72-hour forecast from ECMWF ensemble. Historical library of 20 NatCat events (2020-2025) with actual vs modelled loss.

**Standards:** ['NOAA', 'ECMWF', 'EM-DAT']
**Reference documents:** NOAA Severe Weather Alerts; ECMWF Ensemble Forecast; EM-DAT International Disaster Database

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Build the real threshold-based alerting system (analytics ladder: rung 1 → 4)

**What.** §7's mismatch flag: the guide describes threshold-based alerting (`Alert = HazardIntensity > Threshold(asset_type, peril)`, severity at p99/p95/p90/p75 percentiles) with a 72-hour ECMWF ensemble forecast and modelled-vs-actual loss library, but the `computed` extraction is *empty* — the entire page is static hand-authored seed data (`ALERTS` 13 rows with hard-coded `sev` strings, `FORECAST_EVENTS` literals, `HISTORICAL` with stored `ratio` fields). There is no live hazard feed, no percentile logic, no forecast ingestion. Evolution A builds the real-time system the module is named for.

**How.** (1) Ingest live hazard feeds: NOAA severe-weather alerts and ECMWF/Open-Meteo forecast data (both named in §5; Open-Meteo is already integrated per project memory) as a new ingester, keyed to portfolio asset coordinates. (2) Compute alert severity by comparing forecast hazard intensity to the asset/peril-specific percentile thresholds (p99/p95/p90/p75) — the thresholds derived from the historical hazard distribution at each location (the digital-twin grids provide the climatology). This is the real threshold logic the guide specifies. (3) The 72-hour forecast overlay becomes a real ECMWF ensemble read; the historical library computes `ratio = modelledLoss/actualLoss` at render from the two fields (and grounds `modelledLoss` in the platform's NatCat engine, `actualLoss` in EM-DAT, both named in §5). Rung-4: this is genuinely predictive — forward hazard forecasts driving alerts.

**Prerequisites.** This is greenfield — the page has zero real computation; NOAA/ECMWF/EM-DAT ingestion (partially available); asset-coordinate portfolio linkage. A real-time system needs a scheduled refresh job (the ingestion framework is the scaffold). **Acceptance:** alerts derive from live forecast intensity vs percentile thresholds, not hard-coded strings; the forecast panel reads real ensemble data; historical ratios compute from the two loss figures.

### 9.2 Evolution B — Early-warning triage copilot (LLM tier 1 → 2, gated on real feeds)

**What.** A copilot for the alert workflow §1 describes: "what are my critical alerts and which assets are exposed?", "what's the 72-hour outlook for the Gulf portfolio?", "what's the response protocol for a CRITICAL cyclone alert?" — grounded, post-Evolution-A, in real alert data and the NOAA/ECMWF/EM-DAT references named in §5.

**How.** Near-term (pre-Evolution-A), the only honest tier-1 use is explaining the response protocols and alerting methodology — it must refuse to report "active alerts" because the current 13 alerts are hard-coded fiction with fake timestamps ("4 min ago"), and presenting them as live would be actively dangerous for an early-warning tool. Post-Evolution-A: tool calls to the live-alert and forecast endpoints, with severity and asset-exposure figures traced to the real threshold engine; the response-protocol recommendations map alert severity to the documented action items. Fabrication validator matches every alert count and probability to a tool response.

**Prerequisites (hard).** Evolution A — an early-warning copilot narrating static seed alerts as real-time warnings is the single most dangerous fabrication in this batch (users could act on fake hurricane warnings). Live-alert behaviour is strictly gated. **Acceptance:** pre-Evolution-A the copilot refuses to report active alerts and explains only methodology; post-Evolution-A every alert traces to a live-feed tool call with a real timestamp.