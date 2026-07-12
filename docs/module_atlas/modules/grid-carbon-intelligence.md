# Grid Carbon Intelligence
**Module ID:** `grid-carbon-intelligence` · **Route:** `/grid-carbon-intelligence` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Card`, `FUEL_COLORS`, `GAS_CI`, `GLOBAL_API`, `GRID_API`, `INDEX_COLOR`, `KpiCard`, `LOAD_PRESETS`, `LOW_CARBON_FUELS`, `SNAP_CAPTURED`, `SNAP_CURRENT`, `SNAP_FORECAST`, `SNAP_REGIONAL`, `SectionH`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SNAP_FORECAST` | 51 | `forecast`, `index` |
| `SNAP_REGIONAL` | 50 | `shortname`, `intensity_forecast`, `index`, `low_carbon_perc`, `generation_mix`, `fuel`, `perc` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `GRID_API` | ``${API}/api/v1/grid-carbon`;` |
| `GLOBAL_API` | ``${GRID_API}/global`;` |
| `isLowCarbonFuel` | `(fuel) => /wind\|solar\|hydro\|nuclear\|geothermal\|marine/i.test(fuel \|\| '');` |
| `isFossilFuel` | `(fuel) => /gas\|coal\|oil\|lignite\|peat/i.test(fuel \|\| '');` |
| `SNAP_CAPTURED` | `'2026-07-04T20:50Z';` |
| `GAS_CI` | `394; // gCO2/kWh, CCGT per NESO carbon intensity methodology` |
| `TABS` | `['Live National Grid', 'Forecast & Cleanest Window', 'Regional Breakdown', '24/7 CFE Matcher', 'Methodology & Source'];` |
| `lowCarbonShare` | `useMemo( () => activeMix.filter(m => isLowCarbonFuel(m.fuel)).reduce((a, m) => a + (m.perc \|\| 0), 0), [activeMix] );` |
| `windShare` | `useMemo( () => activeMix.filter(m => /^wind/i.test(m.fuel \|\| '')).reduce((a, m) => a + (m.perc \|\| 0), 0), [activeMix] );` |
| `fossilShare` | `useMemo( () => activeMix.filter(m => isFossilFuel(m.fuel)).reduce((a, m) => a + (m.perc \|\| 0), 0), [activeMix] );` |
| `mixDonut` | `useMemo(() => activeMix.filter(m => (m.perc \|\| 0) > 0).map(m => ({ name: m.fuel, value: m.perc })), [activeMix]);` |
| `gaugePct` | `Math.min(100, (nowCI / GAUGE_MAX) * 100);` |
| `forecastChart` | `useMemo(() => forecastPeriods.map(p => ({` |
| `periodsPerHour` | `useMemo(() => { // live proxy serves half-hour periods; static snapshot is hourly` |
| `diffMin` | `Math.abs(b - a) / 60000;` |
| `cleanestWindow` | `useMemo(() => { const vals = forecastPeriods.map(p => p.forecast).map(v => (v == null ? Infinity : v));` |
| `sum` | `vals.slice(0, k).reduce((a, b) => a + b, 0);` |
| `fcVals` | `forecastPeriods.map(p => p.forecast).filter(v => v != null);` |
| `fcMin` | `fcVals.length ? Math.min(...fcVals) : 0;` |
| `fcMax` | `fcVals.length ? Math.max(...fcVals) : 0;` |
| `fcAvg` | `fcVals.length ? Math.round(fcVals.reduce((a, b) => a + b, 0) / fcVals.length) : 0;` |
| `horizonH` | `Math.round(forecastPeriods.length / Math.max(1, periodsPerHour));` |
| `regionsSorted` | `useMemo(() => [...regions].sort((a, b) => (a.intensity_forecast ?? 0) - (b.intensity_forecast ?? 0)), [regions]);` |
| `regionalBar` | `useMemo(() => regionsSorted.map(r => ({` |
| `cfeSeries` | `useMemo(() => forecastPeriods.map(p => {` |
| `cfeAllPresets` | `useMemo(() => Object.keys(LOAD_PRESETS).map(name => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/grid-carbon/current` | `current_intensity` | api/v1/routes/grid_carbon.py |
| GET | `/api/v1/grid-carbon/forecast` | `forecast` | api/v1/routes/grid_carbon.py |
| GET | `/api/v1/grid-carbon/regional` | `regional` | api/v1/routes/grid_carbon.py |
| GET | `/api/v1/grid-carbon/global/sources` | `global_sources` | api/v1/routes/grid_carbon.py |
| GET | `/api/v1/grid-carbon/global/mix` | `global_mix` | api/v1/routes/grid_carbon.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `datetime` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `two` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `LOW_CARBON_FUELS`, `SNAP_FORECAST`, `SNAP_REGIONAL`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/grid-carbon/current** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['from', 'to', 'intensity', 'generation_mix', 'stale', 'provenance'], 'n_keys': 6}`

**GET /api/v1/grid-carbon/forecast** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['hours', 'period_minutes', 'count', 'periods', 'stale', 'provenance'], 'n_keys': 6}`

**GET /api/v1/grid-carbon/global/mix** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/grid-carbon/global/sources** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sources', 'checked_at'], 'n_keys': 2}`

**GET /api/v1/grid-carbon/regional** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['from', 'to', 'regions', 'stale', 'provenance'], 'n_keys': 5}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **60** other module(s).

| Connected module | Shared via |
|---|---|
| `battery-revenue-stacker` | table:api, table:exc, table:two |
| `credit-spread-climate-monitor` | table:api, table:exc |
| `module-navigator` | table:api |
| `portfolio-stress-test-drilldown` | table:api |
| `portfolio-transition-alignment` | table:api |
| `reference-data-explorer` | table:api |
| `portfolio-climate-pulse` | table:api |
| `portfolio-climate-var` | table:api |
| `financial-modeling-studio` | table:api |
| `portfolio-dashboard` | table:api |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Grid Carbon Intelligence is a thin, cached proxy over the **UK NESO (National Energy
System Operator) Carbon Intensity API** (`api.carbonintensity.org.uk`, free, keyless,
CC-BY 4.0, built with the University of Oxford). The backend
(`backend/api/v1/routes/grid_carbon.py`) exposes three GET routes that forward to real
upstream endpoints:

| Platform route | Upstream call(s) | TTL |
|---|---|---|
| `GET /api/v1/grid-carbon/current` | `GET /intensity` + `GET /generation` | 120s |
| `GET /api/v1/grid-carbon/forecast?hours=96` | 1–2× `GET /intensity/{from}/fw48h` (chained) | 900s |
| `GET /api/v1/grid-carbon/regional` | `GET /regional` | 300s |

There is no synthetic data anywhere in this module. The frontend
(`GridCarbonIntelligencePage.jsx`) renders whatever the proxy returns; if the proxy or
upstream is unreachable it falls back to `SNAP_CURRENT` / `SNAP_FORECAST` /
`SNAP_REGIONAL` — a **real static snapshot** the page's own comments say was "captured
from the live API 2026-07-04T20:50Z," not fabricated placeholder values.

On top of the raw feed, the page adds exactly one derived calculation: a **24/7
carbon-free-energy (CFE) matching calculator** (Tab 3) that scores an hourly load
shape against the live/forecast carbon-intensity series.

### 7.2 Backend proxy mechanics

```python
# backend/api/v1/routes/grid_carbon.py
def _cached_fetch(key, urls, ttl):
    ... returns (payloads, stale) ...
    # on upstream failure: serve a stale cached entry if one exists ("stale": true),
    # else raise HTTPException(502) so the frontend falls back to the static snapshot.
```

- **`/current`** returns the current half-hour settlement period's national
  `intensity` (`forecast`, `actual`, `index` band) and `generation_mix` (list of
  `{fuel, perc}`).
- **`/forecast`** assembles up to 96h from NESO's `fw48h` endpoint, which only returns
  48h per call — the route issues a second call anchored at `now+48h` when
  `hours > 48`, deduplicates periods by `from` timestamp, sorts, and truncates to
  `hours * 2` half-hour periods.
- **`/regional`** slims each of NESO's 17 region rows (14 DNO regions + 3
  England/Scotland/Wales aggregates), computing `low_carbon_perc` as the sum of
  wind + solar + hydro + nuclear generation-mix percentages, and excludes the 3
  aggregate rows unless `include_aggregates=true`.

Serve-stale-on-error means a `stale: true` flag (not a 502) is returned whenever a
previously-cached, now-expired payload exists but the fresh upstream call fails —
this is why the frontend's Live/Demo badge has three states (`loading` /
`live` / `demo`) rather than a hard binary.

### 7.3 24/7 CFE matching — transmission formula

```js
// share mode (default): fossil marginal plant on the GB grid is essentially all CCGT
cfe(t) = max(0, 1 − CI(t) / 394)          // GAS_CI = 394 gCO2/kWh (NESO gas factor)
// threshold mode: binary carbon-aware matching
cfe(t) = CI(t) <= threshold ? 1 : 0

CFE% = Σₜ load(hour(t)) × cfe(t)  ÷  Σₜ load(hour(t))     — over every forecast period t
```

`GAS_CI = 394` gCO2/kWh is documented in-code as NESO's CCGT carbon-intensity factor;
because GB coal generation has been ≈0% since 2024, fossil share of a settlement
period is approximated as `CI(t)/394`, so `1 − CI(t)/394` estimates that period's
zero-carbon generation share. This is a **grid-mix locational proxy**, explicitly
*not* contractual 24/7 CFE accounting under the EnergyTag/Google CFE standard (no
PPA portfolio, storage, or certificate matching is modeled — stated directly in the
page's caveat text).

Four hourly load presets are hard-coded 24-length weight arrays: `Hourly-flat`
(weight 1 all hours), `Solar-shaped` (Gaussian bell `exp(-((h-12)/5)² × 2)` over
05:00–19:00 UTC, peaking at noon), `Office hours` (1.0 during 08:00–18:00, else
0.15), `EV overnight` (1.0 before 06:00, else 0.1).

### 7.4 Worked example — CFE score, Solar-shaped vs Hourly-flat

Using the page's own captured real snapshot (`SNAP_FORECAST`, hourly values, GB
2026-07-05), the midday-to-evening window hours 08–19 gives:

| Hour | Forecast CI (g/kWh) | `cfe(t)=1−CI/394` | Solar weight `w(h)` | `w·cfe` |
|---|---|---|---|---|
| 08 | 60 | 0.8477 | 0.278 | 0.2357 |
| 09 | 56 | 0.8579 | 0.487 | 0.4177 |
| 10 | 50 | 0.8731 | 0.726 | 0.6340 |
| 11 | 48 | 0.8782 | 0.923 | 0.8107 |
| 12 | 46 | 0.8833 | 1.000 | 0.8833 |
| 13 | 47 | 0.8807 | 0.923 | 0.8130 |
| 14 | 56 | 0.8579 | 0.726 | 0.6230 |
| 15 | 76 | 0.8071 | 0.487 | 0.3928 |
| 16 | 112 | 0.7157 | 0.278 | 0.1990 |
| 17 | 140 | 0.6447 | 0.135 | 0.0872 |
| 18 | 152 | 0.6142 | 0.056 | 0.0345 |
| 19 | 153 | 0.6117 | 0.020 | 0.0121 |

Sum of `w·cfe` = **5.1428**; sum of weights = **6.0392** → CFE score (Solar-shaped,
this 12h window) = 5.1428 / 6.0392 = **85.2%**.

For Hourly-flat over the same window (weight = 1 for all 12 hours): sum of `cfe(t)` =
**9.4721** ÷ 12 = **78.9%**.

So over this real midday-to-evening slice, the Solar-shaped profile out-scores
Hourly-flat by **+6.2 percentage points** — it concentrates load at the cleanest
hours (10:00–14:00, CI 46–50 g/kWh) and tapers off sharply before the 17:00–19:00
evening peak (CI 140–153 g/kWh), whereas flat baseload is exposed to that peak at
full weight. (The live page evaluates this over the full fetched forecast horizon —
up to 96h/192 half-hour periods — using the identical formula; this table hand-traces
a 12-hour representative slice of the actual captured data.)

### 7.5 Cleanest-window algorithm

```js
// sliding-window minimum of mean forecast intensity over `windowHours`
k = windowHours * periodsPerHour
best = argmin over i of mean(vals[i .. i+k-1])
```
A standard O(n) sliding-sum minimum (not brute-force per-window recomputation):
maintains a running sum, adding the entering value and subtracting the one leaving
the window each step. Used to recommend a start time for flexible load (EV charging,
batch compute, heat storage).

### 7.6 Companion analytics

- **Intensity gauge** bands (`very low`/`low`/`moderate`/`high`/`very high`) are
  NESO's own published index bands, scaled against a fixed `GAUGE_MAX = 400` g/kWh
  for the visual marker position only (no computation).
- **Regional detail table**: sorts the 14 DNO regions cleanest→dirtiest by
  `intensity_forecast`; "regional spread" KPI = max − min across regions at that
  instant (a live cross-sectional dispersion measure, e.g. clean hydro/wind-heavy
  Scotland vs gas-heavy South West England).

### 7.7 Data provenance & limitations

- **Live path**: every number in Tabs 0–3 is genuine UK NESO data when the backend
  proxy is reachable — verified 2026-07-04 (`/intensity`, `/generation`, `/regional`,
  `/intensity/{from}/fw48h` all returned HTTP 200).
- **Fallback path**: `SNAP_CURRENT`/`SNAP_FORECAST`/`SNAP_REGIONAL` are a single real
  captured snapshot (2026-07-04T20:50Z), not a parametric or seeded generator — so
  even the "Demo" state shows real historical grid conditions, just frozen in time.
- Carbon intensity is **generation-based only** (NESO methodology) — no embodied,
  lifecycle, or imported-electricity upstream emissions are included.
- The CFE calculator is a **locational grid-mix estimate**, not a standards-compliant
  24/7 CFE/EnergyTag calculation; it has no PPA, storage-dispatch, or certificate
  layer.
- Forecast horizon is nominally 96h requested but NESO in practice publishes ~48–54h
  ahead; the route returns whatever exists rather than padding synthetically.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Give a risk/sustainability desk a live read on Great Britain
grid decarbonisation — current and forecast carbon intensity, regional dispersion,
and a load-shape carbon-free-energy score — sourced entirely from NESO's public API,
with no fabricated numbers anywhere in the pipeline.

**8.2 Conceptual approach.** A caching reverse-proxy (Python/FastAPI) sits in front
of NESO's REST API; the frontend (React) renders three live feeds plus a
locally-computed CFE-matching layer that combines the live forecast series with
four stylised hourly load-weight templates.

**8.3 Mathematical specification.**
```
cfe(t)    = max(0, 1 − CI(t)/394)                     [share mode]
cfe(t)    = 1{CI(t) ≤ threshold}                       [threshold mode]
CFE%      = Σ_t w(hour(t))·cfe(t) / Σ_t w(hour(t))
window*   = argmin_i  mean(CI[i .. i+k-1]),  k = windowHours × periodsPerHour
low_carbon_share = Σ_{f ∈ {wind,solar,hydro,nuclear}} mix(f)
```

| Parameter | Value | Calibration source |
|---|---|---|
| `GAS_CI` (fossil marginal factor) | 394 gCO₂/kWh | NESO carbon-intensity methodology (CCGT factor) |
| Index bands | very low/low/moderate/high/very high | NESO published 2025 index bands |
| `GAUGE_MAX` | 400 g/kWh | UI scaling constant only, not a physical threshold |
| TTLs (current/forecast/regional) | 120s / 900s / 300s | Chosen for "fair use" of the free keyless API vs NESO's ~30 min update cadence |

**8.4 Data requirements.** None beyond the NESO API itself — no API key, no
persistence layer, no reference-data joins. The only "input" a user supplies is the
CFE-matcher's load-preset choice and (in threshold mode) the CI limit slider.

**8.5 Validation & benchmarking.** Verified live 2026-07-04 by direct HTTP calls to
all four upstream paths (200 responses with real values); the static fallback
snapshot was captured from that same verification session, so demo-mode numbers are
traceable to a specific timestamp rather than invented.

**8.6 Limitations & model risk.** Single-country (GB) coverage only; no embodied/
import-chain emissions; CFE score is a simplified locational proxy, not a
standards-grade 24/7 CFE calculation; forecast accuracy is entirely NESO's (the
proxy adds no independent forecasting). Fair-use TTL caching means the "live" badge
can lag real-world conditions by up to 15 minutes on the forecast feed.

## 9 · Future Evolution

### 9.1 Evolution A — Multi-region coverage and consumption-based intensity (analytics ladder: rung 3 → 4)

**What.** §7 confirms this is a genuinely honest live module: a thin cached proxy over the UK NESO (National Energy System Operator) carbon-intensity API with no synthetic data anywhere — the frontend renders whatever the proxy returns, and even the "Demo" fallback is a real captured snapshot (2026-07-04T20:50Z), not a seeded generator. Two documented limitations bound it: coverage is UK-only, and intensity is generation-based only (NESO methodology — no embodied or imported-electricity emissions). Evolution A broadens and deepens: add multi-region grid-intensity coverage (ENTSO-E for continental Europe, EIA/WattTime for the US — the ENTSO-E/EIA feeds are already wired platform-wide in wave-1), and add a consumption-based (import-adjusted) intensity alongside the generation-based figure, plus a short-horizon forecast from the historical series (rung-4 predictive).

**How.** (1) Generalise the proxy to multiple grid operators with a region selector, each badged Live/Demo per data availability (extending the honest fallback pattern). (2) A consumption-based intensity that adjusts for interconnector flows, distinct from NESO's generation-based number and clearly labelled. (3) A near-term intensity forecast from the ingested history (the NESO API already provides forward-looking data to anchor it).

**Prerequisites.** Multi-region grid-intensity feeds (ENTSO-E/EIA/WattTime, partly wired); interconnector-flow data for consumption-based intensity. **Acceptance:** the module serves ≥3 regions each with accurate Live/Demo badging; consumption-based intensity is shown alongside generation-based and labelled; a forecast horizon is populated from real data, never padded synthetically.

### 9.2 Evolution B — Grid-timing and carbon-aware-scheduling copilot (LLM tier 2)

**What.** A copilot for operations and demand-flexibility users: "when is the UK grid cleanest in the next 24 hours, and how much carbon would shifting our load to that window save?" tool-calls the NESO proxy (and Evolution A's multi-region/forecast endpoints) and narrates the carbon-optimal timing.

**How.** Tier-2 tool-calling over the grid-intensity proxy; the grounding corpus is §7, which documents the NESO methodology (generation-based, the forward-looking horizon) and the honest Live/Demo behaviour. The copilot's value is carbon-aware scheduling — identifying clean windows and quantifying load-shift savings. Because the data is real, this is a strong tier-2 candidate now. Guardrail: it must respect the Live/Demo badge and state when it's reasoning over the frozen snapshot rather than live data. Every gCO₂/kWh figure validated against the proxy response.

**Prerequisites.** None hard — the proxy is live and PRNG-free; Evolution A broadens coverage. **Acceptance:** every intensity and saving figure traces to a proxy tool call; the copilot flags Demo-snapshot mode when the live proxy is unreachable; carbon-saving estimates use real forward intensity, not assumptions.