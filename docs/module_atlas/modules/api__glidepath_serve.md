# Api::Glidepath_Serve
**Module ID:** `api::glidepath_serve` · **Route:** `/api/v1/glidepaths` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/glidepaths/nze/{sector}` | `get_nze_glidepath` | api/v1/routes/glidepath_serve.py |
| GET | `/api/v1/glidepaths/crrem/{country}/{asset_type}` | `get_crrem_pathway` | api/v1/routes/glidepath_serve.py |
| GET | `/api/v1/glidepaths/sectors` | `list_glidepath_sectors` | api/v1/routes/glidepath_serve.py |
| GET | `/api/v1/glidepaths/stats` | `glidepath_stats` | api/v1/routes/glidepath_serve.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `A13`, `NGFS` *(shared)*, `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `dh_crrem_pathways` *(shared)*, `dh_ngfs_scenario_data`, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/glidepaths/crrem/{country}/{asset_type}** — status `failed`, provenance ['db-empty'], source tables: `dh_crrem_pathways`
Output: `None`

**GET /api/v1/glidepaths/nze/{sector}** — status `passed`, provenance ['db-empty'], source tables: `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['sector', 'scenario', 'region', 'variable_pattern', 'data_points', 'glidepath_series'], 'n_keys': 6}`

**GET /api/v1/glidepaths/sectors** — status `passed`, provenance ['real-db'], source tables: `dh_crrem_pathways`
Output: `{'type': 'object', 'keys': ['ngfs_sectors', 'crrem_asset_types', 'crrem_countries', 'crrem_source'], 'n_keys': 4}`

**GET /api/v1/glidepaths/stats** — status `passed`, provenance ['real-db'], source tables: `dh_crrem_pathways`, `dh_ngfs_scenario_data`
Output: `{'type': 'object', 'keys': ['ngfs_emission_records', 'ngfs_carbon_price_records', 'crrem_records', 'crrem_asset_types', 'crrem_countries', 'crrem_source'], 'n_keys': 6}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded solely in
`backend/api/v1/routes/glidepath_serve.py`. No dedicated engine: this is the **pathway data
service** consumed by `services/data_hub_client.py`, which in turn feeds the `glidepath`
analytics domain.)*

### 7.1 What the domain computes

Four GET endpoints serving decarbonisation reference pathways:

1. **`/nze/{sector}`** — an NZBA-style sector emissions glidepath extracted from stored **NGFS
   scenario data** (`NgfsScenarioData` ORM table). The sector is mapped to an IAM variable
   pattern, records are filtered by scenario/region/model, and each point is returned raw plus
   normalised:

```
glidepath_normalised(yr) = value(yr) / value(first_year)
```

2. **`/crrem/{country}/{asset_type}`** — a CRREM carbon-intensity pathway (kgCO₂/m²·yr).
   **DB-first**: queries `dh_crrem_pathways` (populated by the A13 ingester; includes energy
   intensity kWh/m²) by lowercase property type, ISO-3 country, and scenario ("1.5C"/"2.0C");
   falls back to a hardcoded 14-point reference table when the live table is empty/unavailable.
3. **`/sectors`** — available NGFS sectors (7) + CRREM asset types/countries (live-DB DISTINCT
   values when present, else the reference table's keys).
4. **`/stats`** — record counts: NGFS emissions rows (`variable ILIKE %Emissions%CO2%`), NGFS
   carbon-price rows (`%Price%Carbon%`), CRREM rows/types/countries, with a `crrem_source` flag
   (`live` vs `reference`).

### 7.2 Parameterisation

**Sector → NGFS variable map** (`_SECTOR_EMISSION_VARS`, real NGFS/IAM variable names):

| Sector | NGFS variable pattern |
|---|---|
| Energy | `Emissions\|CO2\|Energy\|Supply` |
| Utilities | `Emissions\|CO2\|Energy\|Supply\|Electricity` |
| Materials | `Emissions\|CO2\|Industrial Processes` |
| Industrials | `Emissions\|CO2\|Energy\|Demand\|Industry` |
| Transport | `Emissions\|CO2\|Energy\|Demand\|Transportation` |
| Buildings | `Emissions\|CO2\|Energy\|Demand\|Residential and Commercial` |
| Agriculture | `Emissions\|CO2\|AFOLU` |
| default | `Emissions\|CO2` |

**CRREM reference fallback** (kgCO₂/m²·yr; 14 values over years
[2020, 2022, …, 2042, 2045, 2050]): office pathways for DE/GB/US/SG/NL (e.g. DE:
44 → 36 (2024) → 24 (2030) → 6 (2040) → 0 (2050)); retail and residential for DE/GB/US; hotel
and logistics for DE/GB. Fallback country resolution: exact ISO-2 → 2-letter prefix → DE →
first available. Note a code quirk: `_CRREM_YEARS` is assigned twice — the first assignment
(5-year steps) is immediately overwritten by the explicit 14-year list, which is the one used.

**ISO-2 → ISO-3 map** (25 countries) reconciles the client's ISO-2 convention with the live
table's ISO-3 keys.

### 7.3 Calculation walkthrough

`/nze/{sector}`: ILIKE match on scenario name (e.g. "Net Zero 2050"), variable pattern, and
exact region (default "World"); optional IAM model filter (GCAM/REMIND/MESSAGEix in NGFS data).
If nothing matches, a **broader retry** searches any `Emissions%CO2%` variable (limit 50). The
first record's value becomes the normalisation base, so `glidepath_normalised` is an index
starting at 1.0 — consumers (e.g. `data_hub_client.get_glidepath`) scale a portfolio's base-year
intensity by this index to build absolute targets.

`/crrem/...`: straight table read ordered by year; null intensities are skipped; the response
labels its provenance (`"CRREM v2.0 (live)"` vs `"CRREM v2.0 (reference fallback)"`).

### 7.4 Worked example

`GET /api/v1/glidepaths/crrem/DE/office` with an empty `dh_crrem_pathways` table returns the
fallback series: `[{year: 2020, intensity: 44}, {2022: 40}, {2024: 36}, …, {2030: 24}, …,
{2045: 2}, {2050: 0}]`, `source: "CRREM v2.0 (reference fallback)"`. A downstream consumer
holding an office asset at 30 kgCO₂/m² in 2030 compares 30 vs 24 → deviation
(30−24)/24 = +25% → RED and a candidate stranding year of 2030 in the `glidepath` domain's
CRREM asset tracker.

`GET /nze/Utilities?scenario=Net Zero 2050` with ingested NGFS Phase data returns e.g. electricity-
supply CO₂ values (Mt CO₂/yr) per model-scenario-year with the normalised index — if 2020 = 13,000
and 2030 = 5,200, `glidepath_normalised(2030) = 0.40`, i.e. a 60% sector reduction target.

### 7.5 Interconnections

- `services/data_hub_client.py` calls these endpoints (or their tables) for
  `get_glidepath`/`get_crrem_pathway`; the **`glidepath`** analytics domain then applies RAG
  logic, interpolation, and stranding-year detection on top.
- `dh_ngfs_scenario_data` also feeds carbon-price lookups elsewhere (`get_carbon_price`), which
  is why `/stats` counts `%Price%Carbon%` rows.

### 7.6 Data provenance & limitations

- **Dual provenance, self-labelled:** live rows come from ingesters (NGFS scenario downloads;
  A13 CRREM ingester); fallbacks are hardcoded stylised values. The CRREM fallback labels itself
  "CRREM v2.0 (reference fallback)" but the numbers are **platform approximations of CRREM's
  shape**, not licensed CRREM v2 pathway data; coverage is only 5 asset types × ≤ 5 countries.
- Fallback country resolution silently substitutes **Germany** (then any first country) for
  unknown countries — a UK logistics query for, say, `PL` returns German values with no warning
  flag in the payload.
- `/nze` normalisation base is simply the first row after ordering by year — if multiple models
  match, rows from different models interleave and the "series" can mix models; the broad-retry
  fallback can return a completely different variable than requested (still labelled with the
  requested sector).
- No interpolation here (that is the consumer's job); no scenario validation (any string is
  accepted for CRREM scenario and simply matches nothing → fallback).
- No synthetic PRNG anywhere in this route.

### 7.7 Framework alignment

- **NGFS scenarios** — the variable patterns are genuine NGFS/IIASA IAM variable names
  (`Emissions|CO2|Energy|Demand|Industry` etc.); NGFS publishes these trajectories per scenario
  (Net Zero 2050, Delayed Transition, …) per model (GCAM, REMIND-MAgPIE, MESSAGEix-GLOBIOM) —
  this domain re-serves the ingested subset.
- **NZBA** — the intended consumption pattern (sector glidepaths for bank target-setting):
  NZBA guidance directs banks to use credible 1.5°C-aligned scenarios such as IEA NZE or NGFS
  Net Zero 2050 as their pathway source — exactly what `/nze` provides.
- **CRREM** — CRREM's published methodology downscales a global 1.5°C/2°C carbon budget to
  country × property-type intensity pathways via the Sectoral Decarbonisation Approach; the live
  table stores both carbon and energy-intensity series per CRREM convention; the fallback mimics
  the format only.

## 9 · Future Evolution

### 9.1 Evolution A — Complete, scenario-parameterised pathway service (analytics ladder: rung 2 → 3)

**What.** This is the read-only **pathway data service** feeding the `glidepath`
analytics domain: four GET endpoints serving NGFS sector glidepaths (normalised to the
first year: `value(yr)/value(first_year)`) and CRREM carbon-intensity pathways. The
atlas exposes a real defect — `/crrem/{country}/{asset_type}` traces as **failed /
db-empty**, meaning the primary CRREM table (`dh_crrem_pathways`) is unpopulated and the
endpoint falls through to (or fails past) its hardcoded 14-point reference fallback.
Evolution A makes the service DB-backed and scenario-complete.

**How.** (1) Run the A13 CRREM ingester so `dh_crrem_pathways` is populated for the
country/asset-type/scenario combinations the endpoint accepts (1.5C / 2.0C), and make
the fallback path explicit in the response (`pathway_source: "hardcoded_fallback"`)
rather than silently substituting. (2) Broaden NGFS extraction beyond the current
single variable-pattern mapping to expose scenario, region, and model as first-class
query params so the sibling `glidepath` engine can select disorderly/hot-house
pathways, not just the default. (3) Verify `/stats` row counts move from db-empty to
real-db across both source tables.

**Prerequisites.** A13 CRREM ingester run against the target DB; NGFS scenario data
(`dh_ngfs_scenario_data`) coverage across scenarios. **Acceptance:**
`/crrem/{country}/{asset_type}` returns status `passed` with `real-db` provenance for
the demo country set; every pathway response labels its source (db vs fallback);
`/stats` reports nonzero NGFS and CRREM record counts.

### 9.2 Evolution B — Pathway lookup as a shared copilot tool (LLM tier 1 → 2)

**What.** This module has no user-facing analytics of its own — it's reference data — so
its LLM value is as a *grounding tool* other copilots call. The `glidepath`,
`net_zero_targets`, and CRREM-stranding copilots should resolve "what's the NZBA path
for cement under NGFS Net Zero 2050?" through `/nze/{sector}` here rather than
recalling numbers, guaranteeing every pathway figure is sourced.

**How.** Tier 1 is a thin explainer over `/sectors` and `/stats` (what pathways exist,
from which source). Tier 2 registers the four GETs as read-only tools; because the
normalisation formula and CRREM DB-first/fallback logic are documented in §7.1, the
copilot can explain *why* two pathways differ (scenario, region, source). This module
is a canonical leaf-tool for the tier-3 Desk Orchestrator: any decarbonisation question
routes here for the reference series.

**Prerequisites.** Evolution A's db-empty fix is mandatory — a copilot serving pathway
numbers from a silently-failed CRREM endpoint would ground other modules' answers in a
hardcoded fallback presented as live data. **Acceptance:** every pathway value a
consuming copilot cites traces to a `/nze` or `/crrem` tool response carrying an honest
`pathway_source` label; requesting an unsupported scenario/country returns an explicit
"not in pathway library" rather than the fallback masquerading as coverage.