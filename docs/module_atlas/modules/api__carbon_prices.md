# Api::Carbon_Prices
**Module ID:** `api::carbon_prices` · **Route:** `/api/v1/carbon-prices` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/carbon-prices/compare` | `compare_carbon_prices` | api/v1/routes/carbon_prices.py |
| GET | `/api/v1/carbon-prices/scenarios` | `list_carbon_price_scenarios` | api/v1/routes/carbon_prices.py |
| GET | `/api/v1/carbon-prices/stats` | `carbon_price_stats` | api/v1/routes/carbon_prices.py |
| GET | `/api/v1/carbon-prices/{scenario}` | `get_carbon_price` | api/v1/routes/carbon_prices.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `NGFS` *(shared)*, `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/carbon-prices/compare** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['region', 'year', 'scenarios'], 'n_keys': 3}`

**GET /api/v1/carbon-prices/scenarios** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['scenarios', 'total'], 'n_keys': 2}`

**GET /api/v1/carbon-prices/stats** — status `passed`, provenance ['real-db'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['total_data_points', 'distinct_scenarios', 'distinct_models'], 'n_keys': 3}`

**GET /api/v1/carbon-prices/{scenario}** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['scenario', 'region', 'year', 'price_usd', 'unit', 'source', 'time_series'], 'n_keys': 7}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> **Scope note.** This is a **read-only data-serving domain** over ingested NGFS scenario data,
> not a pricing model. There is no carbon-price computation in the code — it queries the
> `ngfs_scenario_data` table for the `Price|Carbon` variable and serves the values verbatim.
> Grounded in `api/v1/routes/carbon_prices.py`. Consumed internally by
> `data_hub_client.get_carbon_price(scenario, year)`.

### 7.1 What the domain computes

Four viewer-gated endpoints over one table:

| Endpoint | Computation |
|---|---|
| `GET /{scenario}` | Full carbon-price time-series for a scenario+region; if `year` given, exact value or **nearest-year** match |
| `GET /compare` | Same series for N comma-separated scenarios, each with min/max and optional price-at-year |
| `GET /scenarios` | List of scenarios having carbon-price data: `GROUP BY scenario, model, category` with counts and year range |
| `GET /stats` | `total_data_points`, `distinct_scenarios`, `distinct_models` counts |

The only "logic" is (a) variable resolution and (b) a nearest-year lookup.

### 7.2 Variable resolution & parameterisation

Carbon-price records are matched by NGFS variable name, in priority order:

1. Exact match on `Price|Carbon` then `Price|Carbon|Average` (the `_CARBON_PRICE_VARS` list);
2. Fallback pattern match `%Price%Carbon%` (case-insensitive `ILIKE`).

Region defaults to `"World"`; unit defaults to `"USD/tCO2"` (or the record's own `unit`). Source
is stamped as `NGFS/{model}/{scenario}`. There are **no embedded numeric constants** — every price
is a stored NGFS value. Access requires `require_min_role("viewer")`.

### 7.3 Calculation walkthrough (`GET /{scenario}?year=Y`)

1. `_find_carbon_price_records` runs the priority-ordered query filtered by `scenario ILIKE %…%`
   and `region == World`, ordered by year.
2. If no records, returns a well-formed empty response (`price_usd: null`, source "NGFS (no data
   found)") — never an error.
3. Otherwise builds the full `series` (year, price, unit, model, source).
4. Year selection: exact-year match if present; else `min(series, key=|year − Y|)` — the closest
   available projection year. The nearest-match design means a request for 2033 against a series
   with 2030/2035 anchors returns whichever is arithmetically closer (2035 for 2033).

`/compare` runs this per scenario and additionally reports `min_price`/`max_price` across the
series (guarding against null values).

### 7.4 Worked example (`/compare`)

Request `GET /compare?scenarios=Net Zero 2050,Current Policies&year=2030`. For each scenario the
endpoint pulls its `Price|Carbon` series; suppose Net Zero 2050 holds {2025: 90, 2030: 145, 2035:
240} and Current Policies {2025: 30, 2030: 45, 2035: 60} (USD/tCO₂, illustrative of NGFS shapes).
The response gives, per scenario: `price_at_year = 145` / `45`; `min_price`/`max_price` across the
full series; and the complete `time_series`. If `year=2033` were requested with those anchors, the
nearest match (2035) would be returned as `price_at_year`.

### 7.5 Data provenance & limitations

- **All data is externally sourced** — the ingested NGFS scenario database (`ngfs_scenario_data`,
  populated by the scenario-ingest pipeline). This domain contains **no synthetic/PRNG data** and
  no house model; values, models, and vintages are exactly as NGFS published them.
- Coverage depends entirely on what has been ingested per scenario/model/region — a scenario with
  no `Price|Carbon` variable returns an empty (but valid) series.
- Nearest-year matching can silently substitute a distant year's price when the requested year is
  absent; the response echoes the requested `year` but the returned price may be from another
  year (no interpolation is performed here, unlike the `carbon_price_ets` engine).
- Region is hard-defaulted to World; sub-regional prices require an explicit `region` argument and
  matching ingested rows.

### 7.6 Framework alignment

- **NGFS (Network for Greening the Financial System) scenarios** — the served data are NGFS's
  own carbon-price projections (`Price|Carbon`), produced by the NGFS-commissioned integrated
  assessment models (e.g. REMIND-MAgPIE, GCAM, MESSAGEix-GLOBIOM) across the NGFS scenario set
  (Net Zero 2050, Below 2°C, Delayed Transition, NDCs, Current Policies, etc.). NGFS derives each
  price as the shadow carbon price consistent with the scenario's emissions trajectory and policy
  assumptions; this platform stores and serves those values without re-deriving them.
- Downstream, these prices feed the platform's transition-risk and financed-emissions engines via
  `data_hub_client.get_carbon_price`, giving those models a single authoritative NGFS price source.

## 9 · Future Evolution

### 9.1 Evolution A — Interpolated multi-region carbon-price series (analytics ladder: rung 1 → 2)

**What.** A read-only pass-through domain over ingested NGFS scenario data — four viewer-gated
endpoints serving the `Price|Carbon` variable verbatim from `dh_ngfs_scenario_data`, with the only
logic being variable resolution and a **nearest-year lookup**. §7.5 names the honest limitations:
the nearest-year match can silently substitute a distant year's price when the requested year is
absent (the response echoes the requested year but returns another year's value, with no
interpolation — unlike the sibling `carbon_price_ets` engine); region is hard-defaulted to World;
and coverage depends entirely on what has been ingested. The lineage harness shows most routes
`db-empty` — the NGFS price series are thinly populated. Evolution A adds linear interpolation
between anchor years (so 2033 against 2030/2035 anchors returns an interpolated value, not the
nearer anchor) and broadens ingested region coverage.

**How.** `_find_carbon_price_records` gains an interpolation path mirroring the `carbon_price_ets`
engine's `interpolate_price`, flagged in the response as `interpolated: true`; the ingest pipeline
loads sub-regional NGFS price rows so `region` queries beyond World resolve. Rung 2: expose the full
NGFS scenario grid (model × region × year) so downstream transition-risk engines can select vintage
and model explicitly, not just World/nearest-year.

**Prerequisites.** The `db-empty` provenance across `/compare`, `/scenarios`, `/{scenario}` (§4.2)
is the headline gap — populate `dh_ngfs_scenario_data` with the full NGFS price set (roadmap D0/D1);
the domain must stay a faithful pass-through (interpolation between real anchors is fine;
re-deriving prices is not). **Acceptance:** a 2033 request against 2030/2035 anchors returns an
interpolated value flagged `interpolated: true`, not the 2035 anchor; a non-World region query
resolves; `/scenarios` lists a fully-populated scenario set.

### 9.2 Evolution B — Carbon-price grounding tool for the desk copilots (LLM tier 2)

**What.** Rather than a standalone copilot, this domain's highest-value LLM role is as a **shared
grounding tool** the desk orchestrators call: when any copilot (transition risk, financed emissions,
CBAM, `am` Paris alignment) needs an NGFS carbon price, it tool-calls `/{scenario}` or `/compare`
here — the single authoritative NGFS source `data_hub_client.get_carbon_price` already provides
internally. This guarantees every carbon-price figure across the platform's LLM answers traces to
the same ingested NGFS values, not a model-invented number.

**How.** Register the 4 read endpoints as a low-level tool in the shared tool registry; the
no-fabrication validator treats any carbon-price numeric in a desk-copilot answer as requiring a
call to this domain (or `carbon_price_ets`). The response's `source` stamp (`NGFS/{model}/{scenario}`)
and, post-Evolution A, the `interpolated` flag become the provenance shown in the "show work"
expander. Viewer-role gating already fits the read-only design.

**Prerequisites.** Evolution A's populated series and interpolation flag (so tool answers are
complete and honest about interpolation); Atlas corpus embedded (roadmap D3). **Acceptance:** a
transition-risk copilot answer quoting a 2030 Net Zero carbon price traces to a `/{scenario}` tool
call with its NGFS source stamp; a requested year filled by interpolation is shown as interpolated,
never as an exact NGFS value; an unavailable scenario returns the well-formed empty response, not a
fabricated price.