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
