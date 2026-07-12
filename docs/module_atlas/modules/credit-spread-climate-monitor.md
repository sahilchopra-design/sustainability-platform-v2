# Credit Spread Climate Monitor
**Module ID:** `credit-spread-climate-monitor` · **Route:** `/credit-spread-climate-monitor` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUCKET_TO_SERIES`, `Badge`, `Kpi`, `ResolveInstrumentBadge`, `ResolveInstrumentPanel`, `SECTOR_MAP`, `SERIES_COLOR`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTOR_MAP` | 13 | `bucket`, `transition` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `bps` | `(v) => (v == null \|\| isNaN(v)) ? '—' : `${(v * 100).toFixed(0)} bps`;` |
| `intercept` | `my - slope * mx;` |
| `igHy` | `useMemo(() => chartData.map((r) => ({` |
| `scatter` | `useMemo(() => SECTOR_MAP.map((s) => {` |
| `fit` | `useMemo(() => ols(scatter.map((s) => ({ x: s.x, y: s.y }))), [scatter]);` |
| `min` | `Math.min(...xs), max = Math.max(...xs);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/fred-spreads/status` | `status` | api/v1/routes/fred_spreads.py |
| GET | `/api/v1/fred-spreads/catalog` | `catalog` | api/v1/routes/fred_spreads.py |
| GET | `/api/v1/fred-spreads/series` | `series` | api/v1/routes/fred_spreads.py |
| GET | `/api/v1/openfigi/status` | `status` | api/v1/routes/openfigi.py |
| POST | `/api/v1/openfigi/map` | `map_identifiers` | api/v1/routes/openfigi.py |
| GET | `/api/v1/openfigi/isin-to-issuer/{isin}` | `isin_to_issuer` | api/v1/routes/openfigi.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `FRED` *(shared)*, `LEI`, `__future__` *(shared)*, `api` *(shared)*, `complete`, `datetime` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `maps` *(shared)*, `multiple` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `that` *(shared)*, `typing` *(shared)*, `upstream` *(shared)*
**Frontend seed datasets:** `SECTOR_MAP`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **100** other module(s).

| Connected module | Shared via |
|---|---|
| `maturity-wall-monitor` | table:FRED, table:maps |
| `infra-debt-portfolio-manager` | table:FRED, table:maps |
| `green-bond-pricing-desk` | table:FRED, table:maps |
| `module-navigator` | table:api, table:sqlalchemy |
| `reference-data-explorer` | table:api, table:sqlalchemy |
| `financial-modeling-studio` | table:api, table:that |
| `benchmark-analytics` | table:api, table:sqlalchemy |
| `grid-carbon-intelligence` | table:api, table:exc |
| `real-estate-carbon-analytics` | table:api, table:sqlalchemy |
| `battery-revenue-stacker` | table:api, table:exc |

## 7 · Methodology Deep Dive

> ⚠️ **Demo-mode gap flag.** The seeded fallback (`_SEED_VALUES` in
> `backend/api/v1/routes/fred_spreads.py`) only covers 4 of the 9 catalog series
> (`BAMLC0A0CM`, `BAMLC0A4CBBB`, `BAMLH0A0HYM2`, `BAMLH0A3HYC`). The frontend's
> transition-risk scatter needs `BAMLC0A3CA` (rating A) and `BAMLH0A1HYBB` (rating
> BB) — neither is seeded. In demo-seed mode (no `FRED_API_KEY`), every sector
> mapped to bucket A or BB is silently dropped from the scatter (its `oas` value is
> `undefined`, filtered out by `.filter((s) => s.oas != null)`), and the 6 remaining
> BBB-bucket sectors all share the **identical** y-value (the one seeded BBB
> observation). Hand-tracing the `ols()` function on that actual reduced dataset
> gives `syy = 0` (all y equal) → `ols()` returns `null` → the "Transition–spread R²"
> KPI shows "—" in demo mode. This is a genuine functional gap, not just an
> approximation: the OLS panel is effectively non-functional unless `FRED_API_KEY`
> is configured. §7.4 below hand-verifies this exact failure mode, then shows what
> the fit looks like once all rating buckets are populated.

### 7.1 What the module computes

Credit Spread Climate Monitor proxies **real FRED (Federal Reserve Bank of St.
Louis) ICE BofA option-adjusted-spread (OAS) index series** by credit-rating
bucket, computes the investment-grade-vs-high-yield risk premium, and joins a
**documented, stated sector→rating-bucket mapping** (not fabricated per-sector
market data) onto the live OAS curve to produce a transition-risk-vs-spread scatter
with an ordinary-least-squares (OLS) fit line.

### 7.2 Data source — 9 real ICE BofA OAS series via FRED

`backend/api/v1/routes/fred_spreads.py` catalogs 9 genuine published FRED series
(`CATALOG`), all real ICE BofA US Corporate/High-Yield OAS indices:

| Series id | Bucket | Grade |
|---|---|---|
| BAMLC0A0CM | IG-Aggregate | IG |
| BAMLC0A1CAAA / C0A2CAA / C0A3CA / C0A4CBBB | AAA / AA / A / BBB | IG |
| BAMLH0A0HYM2 | HY-Aggregate | HY |
| BAMLH0A1HYBB / H0A2HYB / H0A3HYC | BB / B / CCC | HY |

FRED requires a free API key (`FRED_API_KEY` env var); without one, `GET /series`
degrades to a **labeled seeded historical sample** (`mode="demo-seed"`) covering
monthly month-end approximations from 2020-01 through 2025-06 for **only 4 of the 9
series** (see the mismatch flag above). The docstring is explicit that FRED does
not publish free *sector*-level OAS series, so the sector→rating join is "a stated
model assumption, not fabricated data" — the rating-bucket curve itself is real
market data regardless of mode.

### 7.3 Sector → rating → OAS join, and the OLS fit (frontend)

```js
const SECTOR_MAP = [ /* 12 sectors, each: {sector, bucket, transition (0-100)} */ ];
const BUCKET_TO_SERIES = { AAA:'BAMLC0A1CAAA', AA:'BAMLC0A2CAA', A:'BAMLC0A3CA',
  BBB:'BAMLC0A4CBBB', BB:'BAMLH0A1HYBB', B:'BAMLH0A2HYB', CCC:'BAMLH0A3HYC' };
scatter = SECTOR_MAP.map(s => ({...s, oas: latest[BUCKET_TO_SERIES[s.bucket]], x: s.transition, y: oas}))
                    .filter(s => s.oas != null);

function ols(points) {                       // verbatim from CreditSpreadClimateMonitorPage.jsx
  const n = points.length;
  const mx = mean(x), my = mean(y);
  sxx = Σ(x-mx)²; sxy = Σ(x-mx)(y-my); syy = Σ(y-my)²;
  if (sxx === 0 || syy === 0) return null;    // <- triggers in demo mode, see flag above
  slope = sxy / sxx;
  intercept = my - slope * mx;
  r = sxy / sqrt(sxx * syy);  r2 = r * r;
}
```
This is a standard bivariate OLS (transition score as regressor `x`, live OAS as
response `y`) computed with the textbook sums-of-deviations formula — no numerical
library is used, just direct summation, which is exactly right at this scale (≤12
points).

### 7.4 Worked example (a) — the actual demo-mode failure

Demo-mode `latest` only has 3 usable ids after the frontend's fixed fetch list:
`BAMLC0A0CM`, `BAMLC0A4CBBB` (seeded), `BAMLH0A0HYM2`, `BAMLH0A3HYC` (seeded); the
other two requested ids (`BAMLH0A1HYBB`, `BAMLC0A3CA`) return empty observation
arrays (`_seed_series` returns `[]` when `_SEED_VALUES.get(series_id)` misses), so
`latest[...]` is `undefined` for those ids. `SECTOR_MAP`'s only bucket that resolves
in demo mode is **BBB** (`BAMLC0A4CBBB`, seeded last value 2025-06 = **1.12**),
which 6 of the 12 sectors map to (Oil & Gas Upstream 84, Integrated Utilities 71,
Cement & Steel 66, Chemicals 52, Real Estate 44, Renewables & Clean Power 22); the
other 6 sectors map to A or BB and are filtered out entirely.

Hand-tracing `ols()` on those 6 surviving points: `x = {84,71,66,52,44,22}`, `y =
{1.12,1.12,1.12,1.12,1.12,1.12}` (all identical — same series, same latest value).
`my = 1.12`; every `(y-my) = 0` → `syy = Σ(y-my)² = 0` → **`ols()` returns `null`**
by its own explicit guard. The KPI card renders `fit ? fit.r2.toFixed(2) : '—'` →
displays **"—"**, confirming the mismatch flagged above from first principles, not
just from reading the seed table.

### 7.5 Worked example (b) — illustrative fit once all 7 buckets are populated

To show what the OLS mechanic produces when `FRED_API_KEY` is configured (so all 9
series, including A and BB, return live values), the table below uses **typical
current-market OAS levels per bucket** (illustrative, since a live key was not
available to this review — the BBB and CCC figures shown *are* the actual seeded
2025-06 values from `_SEED_VALUES`, i.e. 1.12% and 7.20%† respectively; AAA/AA/A/BB/B
are plausible fill-in levels for demonstration only):

| Sector | Transition score `x` | Bucket | OAS `y` (%) |
|---|---|---|---|
| Thermal Coal & Mining | 92 | BB | 1.85 |
| Oil & Gas (Upstream) | 84 | BBB | 1.12 |
| Integrated Utilities | 71 | BBB | 1.12 |
| Airlines & Aviation | 68 | BB | 1.85 |
| Cement & Steel | 66 | BBB | 1.12 |
| Autos (ICE-weighted) | 58 | A | 0.75 |
| Chemicals | 52 | BBB | 1.12 |
| Real Estate (CRE) | 44 | BBB | 1.12 |
| Diversified Banks | 38 | A | 0.75 |
| Renewables & Clean Power | 22 | BBB | 1.12 |
| Technology & Software | 16 | A | 0.75 |
| Healthcare | 12 | A | 0.75 |

†CCC (7.20%) isn't used by any sector in `SECTOR_MAP`, shown for context only.

Hand-computed: `n=12`, `mx = 623/12 = 51.917`, `my = 13.42/12 = 1.1183`.
`sxx = Σ(x-mx)² ≈ 7528.9`; `sxy = Σ(x-mx)(y-my) ≈ 71.97`; `syy = Σ(y-my)² ≈ 1.6134`.

- `slope = sxy/sxx = 71.97 / 7528.9 ≈ 0.00956` %-pts of OAS per transition point
  → **≈0.96 bps/point** (matches the KPI's `slope*100` bps/point display convention)
- `intercept = my − slope·mx = 1.1183 − 0.00956×51.917 ≈ 0.622%` (≈62 bps)
- `r = sxy / √(sxx·syy) = 71.97 / √(7528.9×1.6134) = 71.97/110.22 ≈ 0.653`
- `r2 ≈ 0.427`

So once all rating buckets are live, the fit shows a modest-but-real positive
relationship (R²≈0.43): higher transition-risk sectors cluster in the BB bucket
(the two highest-transition sectors, Thermal Coal and Airlines, are the only BB
points and pull the fit line upward), while the lowest-transition sectors sit at
the tightest (A-bucket) spreads.

### 7.6 Companion analytics

- **HY − IG differential** chart: `BAMLH0A0HYM2 - BAMLC0A0CM` at every observation
  date — a standard credit risk-premium time series, plotted independently of the
  transition-risk panel.
- **Sector → rating → spread table**: sorted by transition score descending, shows
  the mapped bucket and its live OAS side-by-side with the raw transition score
  (gradient bar), making the "stated model assumption" fully visible/auditable
  rather than hidden inside the scatter.

### 7.7 Data provenance & limitations

- **The OAS curve is genuinely real market data** (FRED/ICE BofA), live when
  `FRED_API_KEY` is set; the seeded demo fallback is also real historical data
  (approximate month-end values tracking published 2020 COVID spike / 2022
  widening / 2023-25 range), just incomplete across rating buckets (§ mismatch
  flag above).
- **The sector→rating mapping is an explicit, stated model assumption** — FRED has
  no free sector-level OAS series, so this is a deliberate simplification, not
  fabricated per-sector data, and the UI says so directly.
- **Transition scores (0–100) are platform taxonomy values**, not derived from any
  external transition-risk dataset in this module.
- **R² should not be over-read**: with ≤12 sector points mapped onto only 7
  possible rating buckets, several sectors always share an identical y-value by
  construction — this ties observations together and can inflate or deflate R²
  independent of any real transition-spread relationship.

## 8 · Model Specification

**Status: implemented** (subject to the demo-mode data-completeness gap in §7).

**8.1 Purpose & scope.** Give a credit/climate risk desk a live read on
rating-bucket credit spreads, the IG/HY risk premium, and a transparent, auditable
lens joining sector transition-risk scores onto that real spread curve via OLS.

**8.2 Conceptual approach.** Direct FRED series proxying (no synthetic
interpolation of the market data itself) plus a documented cross-sectional
regression of live OAS against a stated sector transition-risk taxonomy —
explicitly *not* a claim that FRED publishes sector-level spreads.

**8.3 Mathematical specification.**
```
OLS:  slope = Σ(x-x̄)(y-ȳ) / Σ(x-x̄)²
      intercept = ȳ − slope·x̄
      r = Σ(x-x̄)(y-ȳ) / √(Σ(x-x̄)²·Σ(y-ȳ)²);  R² = r²
HY−IG differential: Δ(t) = OAS_HY-Aggregate(t) − OAS_IG-Aggregate(t)
```
| Parameter | Value | Calibration source |
|---|---|---|
| Rating-bucket universe | AAA/AA/A/BBB/BB/B/CCC (+ IG/HY aggregates) | ICE BofA index family as published on FRED |
| Sector transition scores | 12/100 (hard-coded) | Platform's internal sector taxonomy, stated as a model assumption in-UI |
| Seed coverage | 2020-01 → 2025-06, 23 months, 4 of 9 series | `_SEED_MONTHS` / `_SEED_VALUES` in fred_spreads.py |
| Cache TTL | 6h | `_CACHE_TTL` |

**8.4 Data requirements.** A free FRED API key for full live coverage of all 9
rating-bucket series; without it, only 4 series are available and the
transition-risk scatter degrades as documented in §7.4.

**8.5 Validation & benchmarking.** The demo-mode failure (`ols()` returning `null`)
was independently re-derived by hand in §7.4 from the actual `_SEED_VALUES`
contents, confirming the code's own `if (sxx === 0 || syy === 0) return null` guard
fires exactly as expected given the real seeded data. The illustrative fully-live
example in §7.5 reproduces the OLS formula step-by-step against plausible
current-market OAS levels.

**8.6 Limitations & model risk.** Demo mode (no `FRED_API_KEY`) silently loses
half the sector universe from the transition-risk scatter and returns a null R² —
teams relying on this panel for anything beyond a UI smoke-test should configure a
key. Even with a key, R² reflects only 7 distinct rating-bucket y-values across up
to 12 sector points, so statistical power is intrinsically low; the mapping itself
is a stated simplification (each sector assigned to the single rating bucket "its
median issuer trades near"), not an empirically fitted or issuer-weighted mapping.

## 9 · Future Evolution

### 9.1 Evolution A — Close the demo-mode gap, then give the regression a time dimension (analytics ladder: rung 2 → 3)

**What.** This tier-A module is built on real data — 9 genuine ICE BofA OAS series
via FRED, with the sector→rating join explicitly documented as "a stated model
assumption, not fabricated data" — but §7 hand-verifies a live functional gap: the
demo-seed fallback covers only 4 of 9 series, so without `FRED_API_KEY` the A and BB
buckets vanish, six sectors collapse onto one identical BBB value, `syy = 0`, and
the OLS returns `null` — the transition–spread R² panel is non-functional in demo
mode. And even keyed, the fit is a 12-point cross-section against one day's curve.
Evolution A fixes the gap and upgrades the estimation.

**How.** (1) Immediate: extend `_SEED_VALUES` to all 9 catalog series (the missing
`BAMLC0A3CA`, `BAMLH0A1HYBB`, plus AAA/AA/B) so demo mode exercises every code path —
the §7.4 hand-traced failure becomes a regression test. (2) Persist history: a
scheduled FRED ingest into a `fred_oas_history` table (free key, generous limits)
instead of per-request proxying, giving the module a real time series and removing
the key-per-deployment fragility. (3) Estimation upgrade: replace the single-day
12-point OLS with a panel — sector transition scores against bucket OAS across
months — reporting R² with honest caveats about the rating-bucket join's coarseness;
spread *changes* around climate-policy event dates as a second, cleaner
identification. (4) The 12-sector `SECTOR_MAP` transition scores get source
documentation (currently stated but uncited).

**Prerequisites.** FRED key provisioning for the ingest (free); with blast radius
100, the fred-spreads route family is shared plumbing — coordinate changes.
**Acceptance:** demo mode renders a non-null R² with all 7 buckets distinct; the
ingest backfills ≥5 years monthly; the panel regression reproduces from stored
history; the §7 failure mode is covered by a test.

### 9.2 Evolution B — Spread-desk copilot over live OAS state (LLM tier 2)

**What.** A tool-calling copilot for credit analysts: "what's the HY-IG risk premium
doing and which transition-exposed sectors look rich?" calls `GET /fred-spreads/series`
for the live curves, reads the sector join, and answers with the actual basis-point
levels and the regression's current fit — clearly separating three provenance layers
the module already distinguishes: real market OAS, the stated sector→bucket mapping
assumption, and the estimated relationship. Issuer-level questions route through the
module's own OpenFIGI endpoints (`POST /openfigi/map`, `/isin-to-issuer/{isin}`) to
resolve a bond to its issuer before answering.

**How.** Tool schemas over the 6 live operations (all read-only — low-risk tier-2
pilot); grounding corpus is §7's methodology documentation, which is unusually
explicit about what is real versus assumed. The copilot must always report the
`mode` field (`live` vs `demo-seed`) from the status endpoints — a demo-mode answer
that doesn't say so would misrepresent seeded approximations as market data. The
fabrication validator covers every spread level and R².

**Prerequisites.** Evolution A's seed fix (in demo mode today the copilot's
regression tool returns null); ingest history for trend questions.
**Acceptance:** every basis-point figure matches a tool response; demo-mode answers
carry the mode disclosure; asked for sector-level OAS (which FRED doesn't publish),
the copilot explains the rating-bucket approximation rather than inventing a
sector series.