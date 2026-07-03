# A² Intelligence — Data-Lineage Findings & Enhancements
_Auto-generated 2026-06-30 14:36:04 from the E2E lineage sweep._

## Coverage
- **2510** transactions · **1310 passed** · **539 failed** · **661 mutations skipped** (read-only)
- **32,719** functions traced · **1,507** SQL statements · **184** DB tables touched
- Provenance: computed 2021, db-empty 238, real-db 231, mock-sample 25, reference-data 4

## Key learnings
1. **Empty data is the dominant failure mode.** 55 tables were queried but returned no rows, cascading into 404s on detail/by-id endpoints and NaN risk in dashboards.
2. **Failure taxonomy:** missing key/attr (224), 404 / empty-data (132), server 500 (111), other (31), SQL / schema (29), calc / None-handling (11), input validation (1).
3. **1083 passing endpoints read no real DB/reference data** — pure compute or still on sample fallbacks (wiring candidates).
4. **Route-registration P0:** fastapi/starlette drift silently drops API routes on a fresh process start (the live server is a stale, working process).

## Corrections (likely real bugs) — aggregated by signature
_27 failures across 25 distinct signatures._

- **×3 · SQL / schema** — `ProgrammingError: (psycopg2.errors.UndefinedTable) relation "X" does not exist
LINE N: FROM file_uploads 
             ^

[SQL: SELECT file_`  
  e.g. GET /uploads/{upload_id}, GET /uploads/{upload_id}/errors, GET /uploads/{upload_id}/preview — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `HTTPException: N: (psycopg2.errors.UndefinedColumn) column e.country_code does not exist
LINE N:                 SELECT a.*, e.entity_name, `  
  e.g. GET /api/v1/agriculture/assessments/{assessment_id} — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `ProgrammingError: (psycopg2.errors.AmbiguousColumn) column reference "X" is ambiguous
LINE N:             SELECT column_name, data_type, is_`  
  e.g. GET /api/v1/data-preview/tables — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `HTTPException: N: (psycopg2.errors.UndefinedColumn) column e.entity_type does not exist
LINE N:                 SELECT a.*, e.entity_name, e`  
  e.g. GET /api/v1/insurance/assessments/{assessment_id} — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · server 500** — `HTTPException: N: Internal server error during L&D assessment.`  
  e.g. POST /api/v1/loss-damage/assess — _Unhandled handler error on real data — add guard / fix logic._
- **×1 · SQL / schema** — `HTTPException: N: (psycopg2.errors.UndefinedColumn) column e.commodity does not exist
LINE N:                 SELECT a.*, e.entity_name, e.c`  
  e.g. GET /api/v1/mining/assessments/{assessment_id} — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `HTTPException: N: DB query failed: (psycopg2.errors.UndefinedColumn) column b.biodiversity_net_gain_score does not exist
LINE N:            `  
  e.g. GET /api/v1/nature-risk/csrd-entities/biodiversity — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `HTTPException: N: DB query failed: (psycopg2.errors.UndefinedColumn) column w.discharge_high_stress_areas_m3 does not exist
LINE N:         `  
  e.g. GET /api/v1/nature-risk/csrd-entities/water — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · calc / None-handling** — `AttributeError: 'X' object has no attribute 'X'`  
  e.g. GET /api/portfolios — _Handler divides/operates on None from real data — guard it._
- **×1 · SQL / schema** — `HTTPException: N: (psycopg2.errors.UndefinedColumn) column "X" does not exist
LINE N:                 SELECT id, parameter_name, parameter_c`  
  e.g. GET /api/v1/parameters/{param_id} — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `ProgrammingError: (psycopg2.errors.SyntaxError) syntax error at or near "X"
LINE N: ... SELECT * FROM eu_taxonomy_assessments WHERE id = :ai`  
  e.g. GET /api/v1/eu-taxonomy/assessments/{assessment_id} — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `ProgrammingError: (psycopg2.errors.SyntaxError) syntax error at or near "X"
LINE N:         SELECT * FROM pcaf_portfolios WHERE id = :pid::u`  
  e.g. GET /api/v1/pcaf/portfolios/{portfolio_id} — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `ProgrammingError: (psycopg2.errors.SyntaxError) syntax error at or near "X"
LINE N: ...    SELECT * FROM sfdr_pai_disclosures WHERE id = :di`  
  e.g. GET /api/v1/sfdr/pai-disclosures/{disclosure_id} — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `ProgrammingError: (psycopg2.errors.UndefinedTable) relation "X" does not exist
LINE N:                     SELECT * FROM pe_deals
          `  
  e.g. GET /api/v1/pe-deals/db/deals — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `ProgrammingError: (psycopg2.errors.UndefinedTable) relation "X" does not exist
LINE N: SELECT * FROM pe_deals WHERE deal_id = 'X'did'X'UUID'`  
  e.g. GET /api/v1/pe-deals/db/deals/{deal_id} — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `ProgrammingError: (psycopg2.errors.UndefinedTable) relation "X" does not exist
LINE N:                     FROM pe_deals
                   `  
  e.g. GET /api/v1/pe-deals/db/pipeline-summary — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `ProgrammingError: (psycopg2.errors.UndefinedTable) relation "X" does not exist
LINE N:                     FROM pe_sector_risk_heatmap
     `  
  e.g. GET /api/v1/pe-deals/db/sector-heatmap — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `ProgrammingError: (psycopg2.errors.UndefinedTable) relation "X" does not exist
LINE N:                     SELECT * FROM pe_portfolio_compan`  
  e.g. GET /api/v1/pe-portfolio/db/companies — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · SQL / schema** — `ProgrammingError: (psycopg2.errors.UndefinedTable) relation "X" does not exist
LINE N:                     FROM pe_portfolio_companies
     `  
  e.g. GET /api/v1/pe-portfolio/db/summary — _Real query/schema mismatch — fix the SQL or migration._
- **×1 · server 500** — `HTTPException: N: CRREM pathway engine error: 'X' object has no attribute 'X'`  
  e.g. GET /api/v1/re/crrem/pathways/{property_type}/{country_iso} — _Unhandled handler error on real data — add guard / fix logic._
- **×1 · server 500** — `HTTPException: N: CLVaR engine error: 'X' object has no attribute 'X'`  
  e.g. POST /api/v1/re/clvar/calculate — _Unhandled handler error on real data — add guard / fix logic._
- **×1 · server 500** — `HTTPException: N: Portfolio CLVaR engine error: 'X' object has no attribute 'X'`  
  e.g. POST /api/v1/re/clvar/portfolio — _Unhandled handler error on real data — add guard / fix logic._
- **×1 · server 500** — `HTTPException: N: CRREM stranding engine error: 'X' object has no attribute 'X'`  
  e.g. POST /api/v1/re/crrem/stranding — _Unhandled handler error on real data — add guard / fix logic._
- **×1 · server 500** — `HTTPException: N: Full social bond assessment failed`  
  e.g. POST /api/v1/social-bond/full-assessment — _Unhandled handler error on real data — add guard / fix logic._
- **×1 · SQL / schema** — `ProgrammingError: (psycopg2.errors.UndefinedTable) relation "X" does not exist
LINE N: FROM mapping_templates ORDER BY mapping_templates.usa`  
  e.g. GET /uploads/templates — _Real query/schema mismatch — fix the SQL or migration._

## Observations (expected / known gaps)
_512 failures classified as expected._

- ×217 · missing key/attr — Likely mock-input shape; verify against real payload.
- ×91 · server 500 — Expected/known-gap; verify before acting.
- ×13 · 404 / empty-data — Seed the underlying table; not a code bug.
- ×12 · 404 / empty-data — Seed the underlying table; not a code bug.
- ×7 · 404 / empty-data — Seed the underlying table; not a code bug.
- ×6 · other — Expected/known-gap; verify before acting.
- ×6 · missing key/attr — Likely mock-input shape; verify against real payload.
- ×6 · 404 / empty-data — Seed the underlying table; not a code bug.
- ×5 · other — Expected/known-gap; verify before acting.
- ×5 · 404 / empty-data — Seed the underlying table; not a code bug.
- ×5 · 404 / empty-data — Seed the underlying table; not a code bug.
- ×4 · 404 / empty-data — Seed the underlying table; not a code bug.
- ×3 · 404 / empty-data — Seed the underlying table; not a code bug.
- ×3 · 404 / empty-data — Seed the underlying table; not a code bug.
- ×3 · 404 / empty-data — Seed the underlying table; not a code bug.

## Data gaps — empty / unseeded tables
`agriculture_entities`, `agriculture_risk_assessments`, `analysis_runs_pg`, `asean_entities`, `asean_taxonomy_activities`, `boj_scenario_results`, `brsr_disclosures`, `calculation_parameters`, `carbon_calculation`, `carbon_portfolio`, `carbon_project`, `carbon_report`, `carbon_scenario`, `csrd_data_lineage`, `ctp_cbam_liabilities`, `ctp_china_esg_disclosures`, `ctp_export_products`, `ctp_marketplace_listings`, `ctp_supplier_requirements`, `di_loan_portfolio_rows`, `ecl_exposures`, `engagement_commitments`, `engagement_escalations`, `engagement_log`, `esrs_e3_water`, `esrs_e4_biodiversity`, `ets_product_benchmarks`, `fi_entities`, `file_uploads`, `hkma_climate_assessments`, `hkma_entities`, `hub_consistency_checks`, `hub_gap_analyses`, `insurance_climate_assessments`, `insurance_climate_entities`, `iorp_stress_runs`, `mapping_templates`, `mining_entities`, `mining_risk_assessments`, `module_refinement_assignments`, `org_users`, `parameter_change_requests`, `pboc_entities`, `pboc_green_finance_records`, `pcaf_time_series`, `pe_deals`, `pe_portfolio_companies`, `pe_sector_risk_heatmap`, `portfolio_analytics`, `portfolio_reports`, `portfolios`, `project_finance_assessments`, `reference_data_points`, `reference_data_records`, `simulation_runs`

## Core source tables (most-read)
`csrd_entity_registry`×26, `hub_scenarios`×22, `portfolios_pg`×19, `dh_sbti_companies`×19, `dh_ngfs_scenario_data`×16, `scenarios`×15, `dh_yfinance_market_data`×14, `dh_ca100_assessments`×13, `dh_country_risk_indices`×13, `assets_pg`×13, `dh_sec_edgar_filings`×11, `csrd_kpi_values`×11, `csrd_esrs_catalog`×10, `dh_crrem_pathways`×10, `hub_comparisons`×9, `ctp_entities`×9, `ngfs_scenarios_v2`×9, `hub_trajectories`×8, `entity_sanctions`×8, `dh_owid_co2_energy`×8, `entity_lei`×8, `dh_climate_trace_emissions`×8, `hub_sources`×8, `dh_violation_tracker`×8, `carbon_portfolio`×7

## Enhancement backlog
- **[P1] Seed 55 empty tables** (data) — Detail/by-id and dashboard endpoints 404 or read NaN because these tables have no rows. Seed representative reference rows so lineage exercises real data end-to-end.
- **[P1] Write-path coverage: 661 mutation endpoints untested** (harness) — Run with --allow-writes against a disposable Supabase branch DB (create_branch) so POST/PUT/DELETE lineage is captured without touching production.
- **[P1] Smarter mock inputs (schema-example + real-row hydration)** (harness) — Compute endpoints fail on naive mocks (None into arithmetic). Use pydantic field examples/constraints and hydrate request bodies from real list-endpoint rows.
- **[P2] Contract assertions per transaction** (harness) — Beyond 'did it run', assert output schema validity, no NaN/Inf in numeric KPIs, and lineage completeness (every output field traces to a source). Turns lineage into a regression gate.
- **[P2] Frontend lineage layer** (harness) — Drive the 816 React routes headless; capture network → rendered KPIs and stitch to the backend lineage for true source→screen lineage.
- **[P3] Deep-trace mode for 3 capped endpoints** (harness) — Some call trees hit node/depth caps (e.g. portfolio analysis). Offer an opt-in uncapped trace for those flows.
- **[P0] Pin fastapi/starlette (route-registration regression)** (ops) — Installed fastapi 0.137.1 / starlette 0.52.1 drifted from pinned 0.110.1 / 0.37.2 and silently break include_router. Restore pins; add a CI smoke test asserting /api/v1 route count > N.
- **[P2] Run the sweep in CI nightly** (ops) — Read-only sweep + dashboard artifact on each main build; diff pass/fail and provenance vs the prior run to catch data/logic drift.
