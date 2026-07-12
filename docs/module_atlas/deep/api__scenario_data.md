## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/scenario-data` is a **reference-data access layer**, not a modelling engine. It exposes two
ingested datasets stored in Postgres and serves them with filtering, grouping and counting — there
are no formulas beyond SQL aggregation:

| Dataset | Table (ORM) | Row grain | Content |
|---|---|---|---|
| NGFS scenario time-series | `dh_ngfs_scenario_data` (`NgfsScenarioData`) | one (model, scenario, variable, region, year) point | Carbon price, CO₂ emissions, temperature, GDP impact, energy mix … per the IIASA NGFS Scenario Explorer |
| SBTi target registry | `dh_sbti_companies` (`SbtiCompany`) | one company | Commitment status, near-/long-term targets, scope coverage, ambition (1.5C / well_below_2C / 2C), net-zero flag |

Every endpoint requires at least the `viewer` role (`require_min_role("viewer")`).

### 7.2 Endpoint parameterisation

| Endpoint | Query logic (exactly as coded) |
|---|---|
| `GET /ngfs` | `ilike '%…%'` partial match on `scenario`, `variable`, `model`; exact match on `region` and lower-cased `category`; `year >= year_min`, `year <= year_max`; paginated (`limit ≤ 1000`, default 100), ordered by scenario → variable → year |
| `GET /ngfs/scenarios` | `GROUP BY scenario, category` with `count(id)`, `min(year)`, `max(year)` |
| `GET /ngfs/variables` / `/ngfs/models` | `GROUP BY variable` (resp. `model`) with data-point counts |
| `GET /ngfs/compare` | Required `variable`, `region` (default `"World"`), optional model filter; results re-grouped in Python into one `{scenario, category, model, unit, data:[{year, value}]}` series per scenario |
| `GET /sbti` | Partial match on company/country/sector; exact match on `target_status` and `near_term_ambition`; boolean `net_zero_committed`; paginated (`limit ≤ 500`, default 50) |
| `GET /sbti/sectors` | `GROUP BY sector`: company count, `SUM(CASE ambition ILIKE '1.5%')` → `aligned_1_5c`, `SUM(CASE net_zero_committed)` → `net_zero_committed`; ordered by company count desc |
| `GET /sbti/countries` | Same pattern grouped by country (count + net-zero count) |
| `GET /sbti/stats` | Scalar counts: total, `lower(target_status)='committed'`, `='targets set'`, net-zero committed, `ambition ILIKE '1.5%'`, distinct sectors, distinct countries |
| `GET /stats` | Combined NGFS (data points, distinct scenarios, distinct variables) + SBTi (companies, distinct sectors) counts |

Constants worth noting: the only hard-coded values are pagination caps (1000 / 500), the
`region="World"` default in `/ngfs/compare`, and the two case-insensitive status strings
`"committed"` and `"targets set"` in `/sbti/stats` — the code comment states these match the
*actual data values* as ingested.

### 7.3 Calculation walkthrough

1. **NGFS category taxonomy.** Each row carries `category ∈ {orderly, disorderly, hot_house_world}`
   and `phase ∈ {1,2,3,4}` (NGFS vintage). The `/ngfs` filter lower-cases the caller's category so
   `Orderly` and `orderly` are equivalent.
2. **Scenario comparison.** `/ngfs/compare` is the analytical workhorse: given one variable
   (e.g. `Price\|Carbon`) it returns aligned time-series for every scenario in the table, which the
   frontend can chart directly. The unit is taken from whichever row is first seen per scenario —
   the code assumes unit homogeneity within a (scenario, variable) pair, which the ingest's unique
   constraint `uq_ngfs_data_composite (model, scenario, variable, region, year)` supports but does
   not strictly guarantee across models.
3. **SBTi alignment shares.** `aligned_1_5c` is computed with `ILIKE '1.5%'` on
   `near_term_ambition`, so both `1.5C` and any `1.5°C`-style variants count; `net_zero_committed`
   is a stored boolean, not derived.

### 7.4 Worked example — sector alignment share

Suppose `dh_sbti_companies` holds 12 `Software and Services` companies of which 9 have
`near_term_ambition = '1.5C'` and 7 have `net_zero_committed = TRUE`. `GET /sbti/sectors` executes

```
SUM(CASE WHEN near_term_ambition ILIKE '1.5%' THEN 1 ELSE 0 END) = 9
SUM(CASE WHEN net_zero_committed = TRUE       THEN 1 ELSE 0 END) = 7
```

and returns `{"sector": "Software and Services", "companies": 12, "aligned_1_5c": 9,
"net_zero_committed": 7}`. Any *percentage* (9/12 = 75 % aligned) is left to the consumer — the API
deliberately returns raw counts only.

### 7.5 Interconnections

- The `source_id` column links rows back to `dh_data_sources` (data-hub provenance registry); the
  FK is documented in the ORM comment but **not enforced**.
- This domain is the read-side companion to the ingest pipeline behind `api::scenarios`
  (`ngfs_sync_service.py`), which writes `NgfsScenarioData` rows; platform scenario-analysis
  modules consume `/ngfs/compare` for scenario chart overlays.
- `SbtiCompany` also feeds SBTi-alignment displays (per project memory, the SBTi registry is one of
  the Tier-1 public reference-data sources ingested to the platform).

### 7.6 Data provenance & limitations

- **Provenance:** rows are ingested from the **IIASA NGFS Scenario Explorer** and the **SBTi Target
  Registry** (stated in the ORM module docstring). The raw upstream record is retained per row in
  `raw_record JSONB`, and `ingested_at`/`updated_at` timestamps give vintage. No synthetic
  `sr(seed)` PRNG data appears anywhere in this domain — it is real ingested public data, subject
  to ingest freshness.
- **Limitations:**
  - No interpolation between NGFS 5-year time-steps; consumers get raw points only.
  - `/ngfs/compare` mixes models unless the caller passes `model`; NGFS values for the same
    scenario differ materially across GCAM/MESSAGE/REMIND, so unfiltered comparisons can blend
    model families.
  - `/sbti/stats` recognises only two status strings (`committed`, `targets set`); other statuses
    (e.g. removed/expired commitments) are counted in `total_companies` but in neither bucket.
  - No unit conversion or currency deflation is applied to NGFS values.

### 7.7 Framework alignment

- **NGFS (Network for Greening the Financial System) scenarios** — the canonical central-bank
  climate scenario set (Orderly / Disorderly / Hot House World taxonomy, phases 1–4). The module
  stores and serves the official IIASA-published variable time-series rather than re-deriving them.
- **SBTi (Science Based Targets initiative)** — SBTi validates corporate targets against
  sector-specific decarbonisation pathways; a "1.5°C-aligned" label means the near-term target's
  annual reduction rate meets the cross-sector absolute-contraction benchmark (≈4.2 %/yr linear
  reduction) or a sector pathway. The module mirrors the registry's published statuses and ambition
  labels; it does not re-validate targets.
- **TCFD / ISSB IFRS S2** — scenario analysis disclosures require exactly the kind of
  multi-scenario variable comparison `/ngfs/compare` provides; this domain is the data substrate,
  not the disclosure logic.
