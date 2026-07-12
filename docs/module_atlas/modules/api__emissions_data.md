# Api::Emissions_Data
**Module ID:** `api::emissions_data` · **Route:** `/api/v1/emissions` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/emissions/by-lei/{lei}` | `emissions_by_lei` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/climate-trace` | `search_climate_trace` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/climate-trace/sectors` | `ct_sectors` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/climate-trace/countries` | `ct_countries` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/owid` | `search_owid` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/owid/countries` | `owid_countries` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/owid/{iso3}` | `owid_country_series` | api/v1/routes/emissions_data.py |
| GET | `/api/v1/emissions/stats` | `emissions_stats` | api/v1/routes/emissions_data.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `CDP`, `OWID`, `__future__` *(shared)*, `api` *(shared)*, `country` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `national` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/emissions/by-lei/{lei}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/emissions/climate-trace** — status `passed`, provenance ['real-db'], source tables: `dh_climate_trace_emissions`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'records'], 'n_keys': 4}`

**GET /api/v1/emissions/climate-trace/countries** — status `passed`, provenance ['db-empty'], source tables: `dh_climate_trace_emissions`
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/emissions/climate-trace/sectors** — status `passed`, provenance ['db-empty'], source tables: `dh_climate_trace_emissions`
Output: `{'type': 'object', 'keys': ['sectors'], 'n_keys': 1}`

**GET /api/v1/emissions/owid** — status `passed`, provenance ['real-db'], source tables: `dh_owid_co2_energy`
Output: `{'type': 'object', 'keys': ['total', 'offset', 'limit', 'records'], 'n_keys': 4}`

**GET /api/v1/emissions/owid/countries** — status `passed`, provenance ['db-empty'], source tables: `dh_owid_co2_energy`
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/emissions/owid/{iso3}** — status `failed`, provenance ['db-empty'], source tables: `dh_owid_co2_energy`
Output: `None`

**GET /api/v1/emissions/stats** — status `passed`, provenance ['real-db'], source tables: `dh_climate_trace_emissions`, `dh_owid_co2_energy`
Output: `{'type': 'object', 'keys': ['climate_trace', 'owid'], 'n_keys': 2}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/emissions` is a **reference-data access domain**, not a modelling engine: it queries two
ingested public datasets from Postgres — **Climate TRACE** satellite-derived emissions
(`climate_trace_emissions` via the `ClimateTraceEmission` model) and **Our World in Data (OWID)
CO2/energy** country panels (`OwidCo2Energy`) — plus one derived endpoint, `GET /by-lei/{lei}`,
which estimates a counterparty's Scope 1/2/3 emissions from its GLEIF jurisdiction. All endpoints
require at least the `viewer` role. The only computation in the domain is the LEI proxy:

```
country_iso3 = jurisdiction_to_iso3(GLEIF jurisdiction)      (44-entry 2→3 letter map)
if OWID row exists (latest year):
    scope1 = national_co2_Mt × 10⁶ × 0.0001      # "Placeholder scaling" (in-code comment)
    scope2 = national_co2_Mt × 10⁶ × 0.00004
    scope3 = national_co2_Mt × 10⁶ × 0.00006
    dqs = 4, source = "estimated_owid"
elif Climate TRACE country total (gas = co2e) exists:
    same 0.0001 / 0.00004 / 0.00006 fractions on the CT total, year = 2022,
    dqs = 4, source = "estimated_climate_trace"
```

The response always carries an honesty note: "Estimated from country/sector averages (DQS 4-5).
Upgrade to DQS 1-3 with reported data."

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Company-scale fractions | 0.0001 / 0.00004 / 0.00006 of national CO₂ (t) | **Synthetic placeholder** — code comment: "rough proxy; real data comes from CDP/SFDR PAI reporting" |
| Implied scope split | ~60% S1 / 25% S2 / 15% S3 of the scaled total | In-code comment (note: the actual fractions give 50/20/30 of their sum — the comment and constants disagree) |
| PCAF DQS assigned | 5 default (country-average proxy), 4 when a country dataset resolves | PCAF data-quality-score ladder (1 = audited reported, 5 = proxy) |
| LEI validation | exactly 20 alphanumeric chars | ISO 17442 LEI format |
| Jurisdiction map | 44 hardcoded 2→3 letter pairs; unknown codes passed through uppercased | Static table |
| Climate TRACE latest year | 2022 (hardcoded for the CT fallback) | Ingestion vintage |

### 7.3 Calculation walkthrough / API surface

| Endpoint | Behaviour |
|---|---|
| `GET /by-lei/{lei}` | GLEIF lookup → jurisdiction → OWID latest-year row (preferred) or Climate TRACE co2e country sum → scaled scope estimates. LEI not found → nulls with `source: "not_found"`. Consumed by `data_hub_client.get_emissions(lei)`. |
| `GET /climate-trace` | Filterable search (country ISO3, sector ilike, gas, year range), pagination limit ≤ 500, ordered country then year desc. Rows expose facility-level fields (name, id, lat/lon, confidence). |
| `GET /climate-trace/sectors`, `/countries` | Distinct-value inventories with record counts. |
| `GET /owid` | Same filter/pagination pattern over the OWID panel. |
| `GET /owid/countries` | Country inventory with record count and year_min/year_max coverage. |
| `GET /owid/{iso3}` | Full ascending time series for one country (404 if absent). Each row exposes ~35 OWID columns: co2 (total/per-capita/per-GDP/growth/cumulative/share-of-global), fuel splits (coal/oil/gas/cement/flaring/other), CH₄/N₂O/total GHG (± LUCF), energy (primary consumption, per-capita/GDP, electricity generation, renewables/fossil/nuclear/solar/wind/hydro shares), and temperature_change_from_co2/ghg. |
| `GET /stats` | Row and distinct-country counts for both ingestion tables. |

### 7.4 Worked example (by-lei)

LEI resolves to a German entity (`jurisdiction = "DE"` → `DEU`). Latest OWID row for DEU has
`co2 = 674` MtCO₂ (illustrative of the OWID 2022 vintage). Then:

| Output | Computation | Result |
|---|---|---|
| scope1 | 674 × 10⁶ × 0.0001 | **67,400 tCO₂e** |
| scope2 | 674 × 10⁶ × 0.00004 | **26,960 tCO₂e** |
| scope3 | 674 × 10⁶ × 0.00006 | **40,440 tCO₂e** |
| dqs / source | OWID path | 4 / `estimated_owid` |

Every German counterparty receives these same numbers regardless of size or sector — the estimate
is a country constant, useful only as a DQS-4/5 placeholder in PCAF-style aggregations.

### 7.5 Data provenance & limitations

- **Real public data, no PRNG**: Climate TRACE (satellite/ML-derived facility and sector
  emissions; the coalition's data is openly licensed) and OWID's CO2 + energy dataset (compiled
  from the Global Carbon Project, Energy Institute Statistical Review, Jones et al. warming
  attribution) are ingested to Postgres by the platform's reference-data layer; this module only
  reads them.
- The **LEI scope estimate is a stated placeholder**: fixed fractions of national totals, no
  sector, revenue or employee scaling; the in-code comment mismatch (60/25/15 vs actual 50/20/30
  split) is documentation drift worth noting.
- Data freshness is fixed by ingestion vintage (CT fallback year hardcoded to 2022); `confidence`
  from Climate TRACE is passed through but unused in any scoring.
- No unit harmonisation checks between CT (`emissions_quantity`/`emissions_unit`) and OWID (Mt);
  consumers must respect each source's units.

### 7.6 Framework alignment

- **PCAF Global GHG Standard (data quality):** the DQS 1–5 ladder is used as intended — 5 for
  country-proxy, 4 when a country dataset grounds the estimate; PCAF scores 1–3 require
  reported/physical-activity data this endpoint explicitly defers to.
- **GHG Protocol Corporate Standard:** the Scope 1/2/3 decomposition frames the response, though
  scopes here are fixed shares of a proxy rather than inventory-derived.
- **GLEIF / ISO 17442:** LEI is the entity join key (20-char validation, registry lookup),
  aligning with the platform's entity-resolution spine.
- **CSRD/SFDR adjacency:** the response note points to SFDR PAI and CDP reporting as the upgrade
  path from proxy to reported data — consistent with SFDR PAI 1–3 (GHG emissions) sourcing
  hierarchies.

## 9 · Future Evolution

### 9.1 Evolution A — Replace the LEI proxy with sector/revenue-scaled or reported emissions (analytics ladder: rung 1 → 3)

**What.** A reference-data access domain over two ingested public datasets (Climate TRACE satellite
emissions, OWID CO₂/energy panels) plus one derived endpoint. The read endpoints are honest live
aggregates, no PRNG. The one computation — `GET /by-lei/{lei}` — is a **stated placeholder**: it scales
a counterparty's Scope 1/2/3 as fixed fractions (0.0001/0.00004/0.00006) of its *country's* national
CO₂ total, so **every German counterparty gets identical numbers regardless of size or sector** (§7.4),
with an honest "estimated, DQS 4-5, upgrade to reported data" note. §7.5 also flags a documentation
drift: the code comment says 60/25/15 scope split but the constants give 50/20/30. Evolution A replaces
the country-constant proxy with sector/revenue-scaled estimates and a reported-data path.

**How.** `emissions_by_lei` scales the national total by the entity's sector share and revenue/employee
size (via the entity-resolution layer's SEC EDGAR fundamentals and OWID sector splits), lifting the
estimate from DQS 5 to DQS 3–4; when CDP/SFDR-reported emissions exist for the entity, they override
the proxy (DQS 1–2). Rung 3: calibrate the sector-intensity factors against Climate TRACE's own
facility-to-parent roll-ups (which this domain already serves) for entities with matched facilities.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `GET /by-lei/{lei}` and
`/owid/{iso3}` both **failed** (db-empty / lookup); fix the 60/25/15-vs-50/20/30 comment/constant
mismatch. Preserve the honest DQS labelling. **Acceptance:** two German counterparties of different
size/sector receive different Scope 1/2/3 estimates (the §7.4 country-constant behaviour is gone); a
CDP-reported entity returns reported emissions at DQS 1–2; the scope split matches the documented
fractions; the failing endpoints pass the harness.

### 9.2 Evolution B — Emissions grounding tool for the financed-emissions copilots (LLM tier 2)

**What.** This domain's value to the LLM layer is as an **emissions-data grounding tool**: a PCAF/
financed-emissions copilot answering "what are this counterparty's emissions?" tool-calls `/by-lei`
(with its DQS and source label), or `/climate-trace`/`/owid` for facility/country ground truth. The
DQS labelling is the key discipline — the copilot must never present a DQS-5 country-proxy as reported
data, and can surface the upgrade path (CDP/SFDR reporting) the response note already names.

**How.** Register the 8 endpoints as tools; the no-fabrication validator ensures any emissions figure
in a copilot answer traces to a tool call with its DQS and source (`estimated_owid`/`estimated_
climate_trace`/`reported`). Climate TRACE serves as an independent cross-check against self-reported
emissions (a greenwashing/data-quality signal), and OWID grounds country-level context. This is the
emissions leg of a financed-emissions desk orchestrator alongside `facilitated_emissions` and
`dme_dmi`.

**Prerequisites.** Evolution A's improved `/by-lei` (a country-constant proxy is too coarse to ground
counterparty answers reliably) and harness fixes; Atlas corpus embedded (roadmap D3). **Acceptance:**
every emissions figure in a copilot answer traces to a tool call carrying its DQS and source; a
country-proxy estimate is labelled DQS 4–5 (never reported); a Climate TRACE facility figure is
distinguished from an OWID country total with correct units.