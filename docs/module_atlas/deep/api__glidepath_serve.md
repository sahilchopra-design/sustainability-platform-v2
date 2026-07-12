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
