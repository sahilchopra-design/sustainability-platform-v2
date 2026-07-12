# Api::Country_Risk
**Module ID:** `api::country_risk` · **Route:** `/api/v1/country-risk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/country-risk/indices` | `list_available_indices` | api/v1/routes/country_risk.py |
| GET | `/api/v1/country-risk/country/{country_iso3}` | `get_country_profile` | api/v1/routes/country_risk.py |
| GET | `/api/v1/country-risk/rankings/{index_name}` | `get_index_rankings` | api/v1/routes/country_risk.py |
| GET | `/api/v1/country-risk/compare` | `compare_countries` | api/v1/routes/country_risk.py |
| GET | `/api/v1/country-risk/heatmap` | `country_risk_heatmap` | api/v1/routes/country_risk.py |
| GET | `/api/v1/country-risk/coal-capacity` | `coal_capacity_by_country` | api/v1/routes/country_risk.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `GEM`, `db` *(shared)*, `dh_country_risk_indices` *(shared)*, `dh_reference_data` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/country-risk/coal-capacity** — status `passed`, provenance ['real-db'], source tables: `dh_reference_data`
Output: `{'type': 'object', 'keys': ['total_countries', 'showing', 'countries'], 'n_keys': 3}`

**GET /api/v1/country-risk/compare** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/country-risk/country/{country_iso3}** — status `failed`, provenance ['db-empty'], source tables: `dh_country_risk_indices`
Output: `None`

**GET /api/v1/country-risk/heatmap** — status `passed`, provenance ['real-db'], source tables: `dh_country_risk_indices`
Output: `{'type': 'object', 'keys': ['index_name', 'year', 'data'], 'n_keys': 3}`

**GET /api/v1/country-risk/indices** — status `passed`, provenance ['real-db'], source tables: `dh_country_risk_indices`
Output: `{'type': 'object', 'keys': ['indices'], 'n_keys': 1}`

**GET /api/v1/country-risk/rankings/{index_name}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/api/v1/routes/country_risk.py` — a read-only data-service module over ingested public
governance indices; there is no computational engine behind it.)*

### 7.1 What the module computes

The domain serves **third-party country governance/risk indices from the database** — it
computes no scores of its own. All six endpoints are SQL reads over two ingested tables:

- `dh_country_risk_indices` — one row per (index, country, year) with `score`, `rank`,
  `subcategories` (JSON), names and source.
- `dh_reference_data` filtered to `source_name = 'GEM Coal Plant Tracker'` — coal-capacity KPIs
  per country.

| Endpoint | What it returns |
|---|---|
| `GET /indices` | Catalogue: per-index record count, year range, country count |
| `GET /country/{iso3}` | Full profile: every index's time series + latest score/rank, plus coal capacity |
| `GET /rankings/{index}` | Ranked country list for a year (paginated, re-ranked by score) |
| `GET /compare?countries=A,B,…` | 2–20 country side-by-side across indices |
| `GET /heatmap?index_name=…` | All countries + scores for a choropleth |
| `GET /coal-capacity` | GEM coal-plant capacity KPIs grouped by country |

### 7.2 Index metadata (the module's only constants)

`INDEX_META` hard-codes the four supported indices and their real published scales:

| Key | Index | Publisher | Scale | Direction |
|---|---|---|---|---|
| `CPI` | Corruption Perceptions Index | Transparency International | 0–100 | higher = less corrupt |
| `FSI` | Fragile States Index | Fund for Peace | 0–120 | higher = more fragile |
| `FH_FIW` | Freedom in the World | Freedom House | 1–7 PR/CL ratings | 1 = most free |
| `UNDP_GII` | Gender Inequality Index | UNDP HDR | 0–1 | higher = more inequality |

Ranking sort direction is derived from these scales:
`sort = "DESC" if index_name in ("CPI",) else "ASC"` — i.e. only CPI ranks best-first
descending; FSI and GII correctly rank ascending (lower = better). **Note a latent
inconsistency:** the code comment says "CPI/FH_FIW higher = better → DESC", but FH_FIW is *not*
in the DESC set — and per Freedom House's actual 1–7 scale (1 = most free) the implemented ASC
sort is the correct behaviour; only the comment is wrong.

### 7.3 Calculation walkthrough

`GET /country/{iso3}` groups all rows by index, tracks `latest_score/rank/year` by max-year
while accumulating the full time series, then joins coal capacity by *country name* (not ISO
code) against the GEM reference rows. `GET /rankings/{index}` defaults `year` to the DB's
`MAX(year)` (fallback 2023), orders by score with `NULLS LAST`, and assigns a fresh display
rank `i + 1 + offset` alongside the publisher's `original_rank` from the data. `/compare`
builds per-country, per-index `latest` + `time_series` blocks (latest = first row of the
`year DESC` ordering). `/heatmap` returns the flat (iso3, iso2, name, score, rank) array for
the front-end choropleth. `/coal-capacity` first selects up to `limit` distinct countries, then
fetches all their KPI rows and pivots them into a `capacities` map keyed by KPI name.

### 7.4 Worked example — rankings pagination

Request: `GET /rankings/FSI?year=2023&limit=50&offset=50`. The route verifies `FSI` exists in
`INDEX_META`, counts all FSI-2023 rows for `total`, sorts ascending (lower fragility = better),
skips the first 50 and returns rows 51–100 with display ranks `rank = i + 1 + 50` → 51…100.
A country with DB `score = 18.6` appearing first in this page is reported as
`{"rank": 51, "score": 18.6, "original_rank": <publisher rank>}`. No arithmetic beyond the
offset addition and `float()` casts occurs.

### 7.5 Data provenance & limitations

- **No synthetic data and no PRNG in this module** — every number is read from ingested tables.
  Data quality therefore depends entirely on the ingestion pipeline that populated
  `dh_country_risk_indices` / `dh_reference_data` (per the platform's reference-data layer:
  Transparency International CPI, Fund for Peace FSI, Freedom House FIW, UNDP GII, Global
  Energy Monitor Coal Plant Tracker). If the tables are empty, endpoints return empty
  catalogues or 404s — there is no hard-coded fallback dataset.
- The module does not compose the indices into any blended country-risk score; composite
  sovereign scoring lives in the frontend sovereign modules, not here.
- Coal-capacity join is by case-insensitive country *name* equality — vulnerable to naming
  mismatches (e.g. "Korea, South" vs "South Korea"); no ISO-code bridge exists for GEM rows.
- FH_FIW's `score` semantics (PR/CL ratings vs aggregate 0–100 score) are whatever the
  ingestion stored; the route treats all indices as a single scalar `score`.
- `/rankings` re-ranks by score without tie handling (ties get arbitrary consecutive ranks) and
  ignores the publisher's own rank for ordering.

### 7.6 Framework alignment

- **Transparency International CPI** — real methodology: a composite of 13 expert/business
  surveys standardised to 0–100 and averaged (minimum 3 sources per country); the module serves
  the published scores, it does not recompute them.
- **Fund for Peace Fragile States Index** — 12 cohesion/economic/political/social indicators
  each 0–10, summed to 0–120 via content analysis + quantitative data + expert review.
- **Freedom House Freedom in the World** — 25 indicators (0–4 each) aggregated to Political
  Rights (0–40) and Civil Liberties (0–60), mapped to the published 1–7 ratings served here.
- **UNDP Gender Inequality Index** — geometric-mean composite over reproductive health,
  empowerment and labour-market dimensions, 0–1.
- **Global Energy Monitor Coal Plant Tracker** — unit-level coal plant census aggregated to
  country capacity (MW) by status KPI.
- Downstream, these indices are standard inputs to **sovereign ESG/climate risk** assessment
  (e.g. governance pillar of sovereign ESG scores) and to country-risk screens in
  export-finance/Article 6 host-country contexts — that composition happens in other modules.

## 9 · Future Evolution

### 9.1 Evolution A — ISO-bridged joins, tie handling, and a composite governance score (analytics ladder: rung 1 → 3)

**What.** A read-only data-service over ingested third-party governance indices (TI CPI, Fund for
Peace FSI, Freedom House FIW, UNDP GII, GEM Coal Plant Tracker) — it computes no scores of its own,
just SQL reads with correct per-index sort direction (only the code comment is wrong; the ASC sort
for FH_FIW is right, §7.2). §7.5 names the real limitations: the coal-capacity join is by
case-insensitive **country name** equality (vulnerable to "Korea, South" vs "South Korea"), there's
no ISO-code bridge for GEM rows; `/rankings` re-ranks by score with **no tie handling** (ties get
arbitrary consecutive ranks); and the module never composes the indices into a blended risk score.
Evolution A adds an ISO-code bridge for the GEM join, proper tie handling in rankings, and a
composite governance score.

**How.** A country ISO-code reference table bridges GEM coal rows to the `dh_country_risk_indices`
ISO3 keys so joins are robust; `/rankings` assigns dense ranks with explicit tie resolution; a new
`/composite` endpoint blends the normalised indices (each rescaled to a common 0–100 direction) into
a governance score with documented weights — feeding the sovereign-ESG and Article 6 host-country
screens that currently do this composition elsewhere. Rung 3: the composite is calibrated against a
published sovereign-ESG benchmark, with per-index vintage surfaced.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `GET /compare`,
`/country/{iso3}`, and `/rankings/{index}` all **failed** (db-empty or lookup bugs); the domain has
no hard-coded fallback (§7.5), so ingested tables must be populated (roadmap D0/D1). Fix the stale
code comment about FH_FIW sort direction. **Acceptance:** the §7.4 rankings pagination reproduces
with dense tie ranks; a coal-capacity query resolves via ISO code, not name matching; the detail and
compare endpoints pass the harness; a composite score is reproducible from its component indices.

### 9.2 Evolution B — Country-risk copilot over the governance indices (LLM tier 1 → 2)

**What.** A copilot answering "how does this country rank on corruption and fragility?", "compare
these five countries across all indices", and "which coal-heavy countries have the weakest
governance?" — grounded in the served indices with each figure attributed to its publisher (TI, Fund
for Peace, Freedom House, UNDP, GEM) and vintage. Because the domain is a faithful pass-through, the
copilot's value is navigation and synthesis, never re-scoring; it must state each index's scale and
direction (CPI higher=cleaner, FSI higher=more fragile) so comparisons aren't misread.

**How.** Tier-1 roadmap pattern initially: the `INDEX_META` scales/directions and framework alignment
(§7.6) embedded as the module corpus; served via `POST /api/v1/copilot/country-risk/ask`. Graduate
to tier 2 by tool-calling `/country/{iso3}`, `/rankings`, `/compare`, `/heatmap` and `/coal-capacity`
so answers come from real filtered data, with the no-fabrication validator checking every score and
rank against tool output. Post-Evolution A, it can narrate the composite governance score.
Composable into sovereign-ESG and export-finance workflows.

**Prerequisites.** Evolution A's harness fixes (working detail/compare/rankings endpoints for
tool-calling) and populated tables; Atlas corpus embedded (roadmap D3). **Acceptance:** every index
value cited is attributed to its publisher with scale, direction and vintage; a rank matches the
`/rankings` tool output; the copilot never blends indices into a score before Evolution A's
documented composite exists.