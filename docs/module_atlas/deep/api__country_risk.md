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
