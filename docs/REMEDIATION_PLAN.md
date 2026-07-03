# A² Intelligence — Remediation Plan (Lineage Sweep)

_Derived from the full E2E lineage sweep (269 domains · 2,510 transactions · 32,719 functions).
539 failures → **27 corrections** (real bugs, 25 signatures) + **512 observations** (expected /
harness artifacts). Each correction below has a verified root cause from the captured trace._

Priority key: **P0** ship-blocker · **P1** real bug, fix this wave · **P2** quality · **P3** nice-to-have.
Effort: S ≤1h · M ≤½day · L ≥1day.

---

## Wave 1 — Corrections (real product bugs)

### A. Missing database tables (5) — query references a table that doesn't exist
Root cause: handler/service SQL targets tables that were never migrated (or the name drifted).

| Table referenced | Endpoint(s) | Fix | Pri/Effort |
|---|---|---|---|
| `file_uploads` | `GET /uploads/{id}`, `/uploads/{id}/preview`, `/uploads/{id}/errors` | Add Alembic migration creating `file_uploads` (id, filename, status, uploaded_at, error_json…) **or** repoint to the existing intake table | P1 / M |
| `mapping_templates` | `GET /uploads/templates` | Migration for `mapping_templates` (id, name, mapping_json) + seed defaults | P1 / S |
| `pe_deals` | `GET /api/v1/pe-deals/db/deals` | Migration for `pe_deals` + seed, or gate endpoint behind a "no data" 200 | P1 / M |
| `pe_sector_risk_heatmap` | `GET /api/v1/pe-deals/db/sector-heatmap` | Migration + seed | P1 / M |
| `pe_portfolio_companies` | `GET /api/v1/pe-portfolio/db/companies` | Migration + seed | P1 / M |

**Resolution:** one Alembic revision adding the 5 tables (PE module + uploads), each with a minimal
seed; verify by re-running `python lineage/run.py --module api.v1.routes.pe_deals` etc. → expect
`real-db` / `db-empty` instead of `UndefinedTable`.

### B. Missing / renamed columns in JOIN queries (6) — `SELECT` names a column the table lacks
Root cause: assessment queries join an entity table and select columns that aren't on it
(schema written ahead of migration).

| Missing column | Endpoint | Fix |
|---|---|---|
| `agriculture_entities.country_code` | `GET /agriculture/assessments/{id}` | Add column to table, or drop `e.country_code` from the SELECT (it's also fetchable via the assessment row) |
| `insurance` entity `e.entity_type` | `GET /insurance/assessments/{id}` | Same pattern — add column or remove from SELECT |
| `mining` entity `e.commodity` | `GET /mining/assessments/{id}` | Same |
| `b.biodiversity_net_gain_score` | `GET /nature-risk/csrd-entities/biodiversity` | Align query to the CSRD entity schema (column renamed/absent) |
| `w.discharge_high_stress_areas_m3` | `GET /nature-risk/csrd-entities/water` | Same |
| `parameter_category` | `GET /api/v1/parameters/{id}` | Qualify/rename to the real column on `calc_parameters` |

**Resolution:** a single migration adding the genuinely-missing entity columns **or** correcting the
SELECT lists. Pick per column: if downstream code uses the value → add column + backfill; if not →
trim the SELECT. Re-run the three `*/assessments/{id}` endpoints to confirm `real-db`.

### C. SQL syntax / ambiguity (2)
| Bug | Endpoint | Fix | Pri/Effort |
|---|---|---|---|
| `AmbiguousColumn: "column_name"` — unqualified column in an `information_schema` + PK join | `GET /api/v1/data-preview/tables` | Qualify as `c.column_name` (and the other selected cols) in the metadata query | P1 / S |
| `SyntaxError at or near …` (×3) | `GET /api/v1/eu-taxonomy/assessments/{id}` and 2 siblings | Fix the malformed SQL (likely an unparameterised/empty `IN ()` or trailing clause); parameterise | P1 / M |

### D. Route ↔ engine API drift (real code bug) — `re-clvar` (×4)
Root cause: the route calls engine methods that **don't exist**.
- `api/v1/routes/re_clvar.py:166,264` → `RECLVaREngine().calculate(...)`, but the engine exposes
  `calculate_physical_clvar()` / `calculate_transition_clvar()` / `run_monte_carlo()`.
- `:198,305` → `CRREMStrandingEngine().assess_stranding(...)` / `.get_pathway(...)` — also absent.

**Resolution (P1 / M):** align the route to the real methods (e.g. call `calculate_physical_clvar`
then `calculate_transition_clvar`, compose the response) **or** add thin `calculate()` /
`assess_stranding()` / `get_pathway()` wrappers on the engines. Add a unit test asserting each route's
engine call resolves. Same pattern likely explains the `social-bond` and `loss-damage-finance` 500s —
verify their engine method names too.

### E. Duplicate / un-prefixed router (structural)
Root cause: `api/v1/routes/portfolios.py` declares `APIRouter(prefix="/portfolios")` (no `/api`),
so `/portfolios`, `/portfolios/{id}`, `/portfolios/{id}/holdings` are mounted **in parallel** to the
canonical `/api/v1` portfolio APIs (`portfolio_pg`, `portfolio_analytics`).

**Resolution (P1 / S):** confirm `portfolios.py` is legacy; if superseded, stop including it (remove its
`app.include_router`) or re-prefix to `/api/v1/...`. Eliminates the ambiguous surface and the 5
duplicate failures.

---

## Wave 2 — Observations (512) — no code fix; data or harness

| Class | Count (≈) | Why expected | Action |
|---|---|---|---|
| missing key/attr (mock body) | ~430 | A primitive/dict stood in for a request model; FastAPI would 422 in prod | Fixed by **mockgen enhancement** (below) — not a product bug |
| 404 / empty-data | ~55 | Detail/by-id endpoints over **unseeded tables** | **Seed the 55 empty tables** (below) |
| auth required | a few | Endpoint needs a session | Provide a test JWT in the harness (optional) |

These confirm the two highest-leverage enhancements clear the vast majority of "failures".

---

## Wave 3 — Enhancements (with resolution plans)

| ID | Pri | Enhancement | Resolution |
|---|---|---|---|
| E1 | **P1** | **Smarter mock inputs** | In `lineage/mockgen.py`, instantiate nested models as real instances (not dicts), build `List[Model]` as `[Model(...)]`, and **hydrate request bodies from a real list-endpoint row** when one exists. Expected to convert ~430 observations into passing real-data lineage and expose any genuine logic bugs hiding under them. |
| E2 | **P1** | **Seed the 55 empty tables** | Generate representative rows (use reference-data + existing seeds) so detail/dashboard endpoints exercise real data. Re-sweep to confirm `db-empty` → `real-db`. |
| E3 | **P1** | **Write-path coverage** | Run `python lineage/run.py --allow-writes` against a **disposable Supabase branch** (MCP `create_branch`) to capture lineage for the 661 skipped mutation endpoints without touching production. |
| E4 | P2 | **Contract assertions** | Per transaction, assert output schema validity + no NaN/Inf in numeric KPIs + every output field traces to a source. Turns the sweep into a regression gate. |
| E5 | P2 | **Frontend lineage layer** | Drive the 816 React routes headless; capture network → rendered KPIs; stitch to backend lineage for true source→screen lineage. |
| E6 | **P0** | **Dependency isolation** | `fastapi/starlette` pin already restored + verified. Durable fix: a **dedicated backend venv** from `requirements.txt` so `streamlit` (needs starlette≥0.40) can't drift it again. Add a CI smoke test asserting `/api/v1` route count > 2000. |
| E7 | P2 | **Nightly CI sweep** | Read-only sweep + dashboard artifact each main build; diff pass/fail + provenance vs prior run to catch data/logic drift. |

---

## Suggested execution order
1. **E6** venv + CI route-count guard (protect the API). 
2. **Wave 1 D + E** (re-clvar engine drift, duplicate router) — pure code, no data dependency.
3. **Wave 1 A + B + C** (one migration each for tables + columns; fix the 2 SQL queries).
4. **E1** smarter mock inputs → re-sweep → confirm corrections drop and surface any newly-revealed real bugs.
5. **E2** seed empty tables → re-sweep. 
6. **E3** write-path coverage on a branch.
7. **E4/E5/E7** quality + frontend + CI.

Re-run after each wave: `python lineage/orchestrate.py && python lineage/analyze.py` and watch the
**Corrections** count in the dashboard trend toward zero.
