# A² Intelligence — Data-Lineage Sweep: Learnings & Enhancements

_Companion to the auto-generated `backend/lineage_output/LINEAGE_FINDINGS.md` and the
interactive dashboard (`lineage_dashboard/index.html`). This doc adds the architectural
learnings the analyzer can't infer from the data alone._

## What was built

An instrumented **E2E data-lineage harness** (`backend/lineage/`) that, for every backend
endpoint, records a *transaction*: the data **source** (every SQL statement + tables + row
counts), the **transform** (the full application function call tree, args→return→timing),
and the **output** — tagged with provenance (real-db / reference-data / mock-sample /
db-empty / computed). Runs read-only by default (mutating endpoints skipped to protect
production). Records → JSON traces + append-only ledger → interactive dashboard.

## Coverage achieved (full sweep)

| Metric | Value |
|---|---|
| Route modules swept | **254** |
| Transactions recorded | **2,423** |
| Passed / Failed / Skipped (mutations) | **1,285 / 522 / 616** |
| Functions traced | **32,478** |
| SQL statements captured | **1,384** |
| DB tables touched | **180** |

Provenance: `computed 1971 · db-empty 224 · real-db 210 · mock-sample 23 · reference-data 4`.

## Key learnings

1. **The platform is largely seed/compute-driven, not DB-driven.** Only ~**210** transactions
   read real rows and just **4** touched the reference-data layer; **1,971** were pure
   computation or sample fallbacks. Many modules synthesise data in-handler rather than
   reading the DB — consistent with the frontend's per-page seed pattern. This is the single
   biggest signal: the "source" in source→output is, today, mostly code, not data.

2. **Empty/unseeded tables are the dominant data gap (54 tables).** Tables like
   `agriculture_entities`, `carbon_portfolio`, `brsr_disclosures`, `insurance_climate_assessments`
   are queried but hold no rows, cascading into 404s on detail/by-id endpoints and NaN risk in
   dashboards. Seeding representative rows would convert a large share of failures + `db-empty`
   into real lineage.

3. **Failure taxonomy** (522 failures): `missing key/attr 219`, `404 / empty-data 122`,
   `server 500 111`, `SQL/schema 29`, `calc/None-handling 9`, `input validation 1`. The
   `missing key/attr` bucket is mostly the harness's naive mock inputs hitting handler logic
   that expects real-shaped payloads — a harness-input quality signal more than a product bug.

4. **P0 — route registration is broken on a fresh process.** Installed `fastapi 0.137.1` /
   `starlette 0.52.1` have drifted from the pinned `0.110.1 / 0.37.2`; the drifted pair
   silently makes `include_router` register **0** routes. The live `:8001` works only because
   it's a **stale process** from before the upgrade — a restart would take the API down. Fix:
   restore the pins and add a CI smoke test asserting `/api/v1` route count > N.

5. **Architecture notes** (from this and the UI work): every one of the 816 React modules keeps
   its **own copied `T` palette + primitives**, so global UI change is a token-migration, not a
   single edit; and `server.py` assembles ~60 routers at module scope, which the version drift
   silently defeats. Both argue for stronger import-time/route-count assertions in CI.

## Enhancement backlog (prioritised)

**Ops**
- **[P0]** Pin `fastapi==0.110.1` / `starlette==0.37.2`; add CI route-count smoke test.
- **[P2]** Run the read-only sweep nightly in CI; diff pass/fail + provenance vs prior run to
  catch data/logic drift; publish the dashboard as a build artifact.

**Data**
- **[P1]** Seed the 54 empty tables with representative reference rows so detail/dashboard
  endpoints exercise real data end-to-end.

**Harness**
- **[P1]** Smarter mock inputs — use Pydantic field examples/constraints and hydrate request
  bodies from real list-endpoint rows (kills most `missing key/attr` + `calc/None` failures).
- **[P1]** Write-path coverage — run with `--allow-writes` against a disposable **Supabase
  branch** so the 616 mutation endpoints get real lineage without touching production.
- **[P2]** Contract assertions per transaction — assert output schema validity, no NaN/Inf in
  numeric KPIs, and lineage completeness (every output field traces to a source). Turns the
  sweep into a regression gate.
- **[P2]** Frontend lineage layer — drive the 816 React routes headless, capture network →
  rendered KPIs, and stitch to backend lineage for true **source→screen** lineage.
- **[P3]** Deep-trace mode for the handful of endpoints whose call trees hit the node/depth caps
  (e.g. portfolio analysis).

## How to re-run

```bash
cd backend
python lineage/run.py stranded-assets        # one domain
python lineage/orchestrate.py                 # full sweep (subprocess-isolated, read-only)
python lineage/analyze.py                     # regenerate learnings
python lineage/dashboard.py                   # rebuild dashboard
# view: serve lineage_dashboard/ (launch config "lineage-dashboard", port 4505)
```
