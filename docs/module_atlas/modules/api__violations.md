# Api::Violations
**Module ID:** `api::violations` · **Route:** `/api/v1/violations` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/violations/search` | `search_violations` | api/v1/routes/violations.py |
| GET | `/api/v1/violations/companies` | `violation_companies` | api/v1/routes/violations.py |
| GET | `/api/v1/violations/types` | `violation_types` | api/v1/routes/violations.py |
| GET | `/api/v1/violations/agencies` | `violation_agencies` | api/v1/routes/violations.py |
| GET | `/api/v1/violations/sectors` | `violation_sectors` | api/v1/routes/violations.py |
| GET | `/api/v1/violations/company/{company_name}` | `violations_by_company` | api/v1/routes/violations.py |
| GET | `/api/v1/violations/stats` | `violation_stats` | api/v1/routes/violations.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `db-empty`, `real-db`

**Database tables:** `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `dh_violation_tracker`, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/violations/agencies** — status `passed`, provenance ['real-db'], source tables: `dh_violation_tracker`
Output: `{'type': 'object', 'keys': ['agencies'], 'n_keys': 1}`

**GET /api/v1/violations/companies** — status `passed`, provenance ['real-db'], source tables: `dh_violation_tracker`
Output: `{'type': 'object', 'keys': ['companies'], 'n_keys': 1}`

**GET /api/v1/violations/company/{company_name}** — status `failed`, provenance ['db-empty'], source tables: `dh_violation_tracker`
Output: `None`

**GET /api/v1/violations/search** — status `passed`, provenance ['real-db'], source tables: `dh_violation_tracker`
Output: `{'type': 'object', 'keys': ['records', 'total'], 'n_keys': 2}`

**GET /api/v1/violations/sectors** — status `passed`, provenance ['real-db'], source tables: `dh_violation_tracker`
Output: `{'type': 'object', 'keys': ['sectors'], 'n_keys': 1}`

**GET /api/v1/violations/stats** — status `passed`, provenance ['real-db'], source tables: `dh_violation_tracker`
Output: `{'type': 'object', 'keys': ['violations'], 'n_keys': 1}`

**GET /api/v1/violations/types** — status `passed`, provenance ['real-db'], source tables: `dh_violation_tracker`
Output: `{'type': 'object', 'keys': ['types'], 'n_keys': 1}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/violations` is a **pure query/aggregation domain** over the `dh_violation_tracker` table (Data Hub corporate-violation dataset). There is no engine file — all seven endpoints live in `backend/api/v1/routes/violations.py` and are parameterised SQL against PostgreSQL:

| Endpoint | Computation |
|---|---|
| `GET /search` | filtered listing (company/parent ILIKE, exact violation_type/severity/country_iso3, agency/sector ILIKE, `penalty_amount_usd ≥ min_penalty`), ordered `penalty_amount_usd DESC NULLS LAST`, paged (limit ≤ 500) + total count |
| `GET /companies` | GROUP BY parent_company: violation count, `SUM/MAX(penalty_amount_usd)`, distinct violation types, `BOOL_OR(repeat_offender)` |
| `GET /types` | GROUP BY violation_type: count, total and **average** penalty |
| `GET /agencies` | GROUP BY agency: count, total penalties, distinct companies affected |
| `GET /sectors` | GROUP BY sector: violations, total penalties, distinct parents, distinct types |
| `GET /company/{name}` | all rows where company or parent ILIKE %name%, newest first; 404 if none |
| `GET /stats` | scalar counts: total rows, distinct parents, `SUM(penalty)`, distinct types/agencies, repeat-offender count |

All endpoints require at least the `viewer` role (`require_min_role("viewer")`).

### 7.2 Parameterisation — table schema as the "rubric"

The queries reveal the full analytic schema of `dh_violation_tracker`: `company_name`, `parent_company`, `country_iso3`, `sector`, `violation_type`, `sub_type`, `agency`, `violation_date`, `resolution_date`, `penalty_amount_usd`, `description`, `case_id`, `severity`, `status`, `repeat_offender`. This mirrors the field structure of the public **Violation Tracker** dataset (Good Jobs First), which catalogues US federal/state enforcement actions with parent-company matching — the platform's `dh_` prefix marks it as a Data Hub ingestion table. There are no model constants, weights, or thresholds in this domain; the only "scoring" is ordering by monetary penalty.

### 7.3 Calculation walkthrough

Search filters are ANDed; text filters use `ILIKE '%…%'` (case-insensitive substring), categorical filters exact-match, country is upper-cased before comparison. Every ranking uses `ORDER BY … DESC NULLS LAST`, so records with unknown penalties sink to the bottom rather than being excluded — counts include them, monetary sums treat them as NULL (ignored by `SUM`/`AVG`). Aggregations by *parent_company* (companies/sectors endpoints) consolidate subsidiaries under their ultimate owner, which is the analytically meaningful unit for recidivism (`BOOL_OR(repeat_offender)`).

### 7.4 Worked example

Suppose the table holds three rows for parent "Acme Corp": penalties $10M (EPA, environmental), $2M (OSHA, workplace-safety), and one with `penalty_amount_usd = NULL` (pending case). `GET /companies` returns for Acme:

| Field | SQL | Value |
|---|---|---|
| violations | `COUNT(*)` | 3 |
| total_penalties_usd | `SUM(penalty)` — NULL ignored | 12,000,000 |
| largest_penalty_usd | `MAX(penalty)` | 10,000,000 |
| violation_types | `COUNT(DISTINCT violation_type)` | 2 |
| is_repeat_offender | `BOOL_OR(repeat_offender)` | true if any row flagged |

`GET /types` for "environmental" would report `avg_penalty_usd = SUM/COUNT(non-null)` — the pending NULL row does not drag the average down (a subtle but correct NULL semantics choice).

### 7.5 Data provenance & limitations

- **No PRNG, no synthetic seeds, no computation beyond SQL aggregates** — figures are only as good as the ingested `dh_violation_tracker` rows. Provenance of the ingestion itself (source snapshot date, coverage) is not exposed by any endpoint; there is no `last_updated` metadata route.
- ILIKE substring matching can over-match (searching "Shell" also returns "Shellpoint"); no entity resolution or LEI linkage is applied at query time — parent attribution is whatever the ingest supplied.
- `search` interpolates the WHERE clause via f-string but every value is a **bound parameter** (`:company` etc.), so it is not SQL-injectable; only the structural condition strings are code-controlled.
- No currency normalisation logic visible — `penalty_amount_usd` is assumed pre-converted; no inflation adjustment across vintages, so multi-decade totals mix nominal dollars.
- `repeat_offender` is a stored flag, not derived here — its definition (e.g. >1 violation in N years) belongs to the ingestion pipeline and is unknowable from this code.

### 7.6 Framework alignment

- **Good Jobs First Violation Tracker** — the schema (parent matching, agency, penalty, case ID, offense type) is the de-facto standard structure for corporate enforcement data; this domain replicates its core analytics (top offenders by cumulative penalty, agency league tables).
- **ESG controversy screening (SFDR PAI 10/11, UNGC screening)** — enforcement-action data of this shape is the raw input for "violations of UN Global Compact principles" indicators: SFDR Annex I PAI 10 counts UNGC/OECD-MNE violations and PAI 11 checks policy/compliance mechanisms. This module supplies the queryable evidence layer; the mapping to PAI indicators happens in the SFDR modules.
- **OECD Guidelines for Multinational Enterprises / supply-chain due-diligence (CSDDD)** — company-level violation history retrieval (`/company/{name}`) supports the adverse-track-record checks these frameworks require in counterparty due diligence.

## 9 · Future Evolution

### 9.1 Evolution A — Entity-resolved misconduct scoring (analytics ladder: rung 1 → 3)

**What.** Today this is a pure SQL query/aggregation domain over `dh_violation_tracker` (seven read endpoints, no engine file, ordering by penalty is the only "scoring"). §7.5 names the gaps: ILIKE substring matching over-matches ("Shell" → "Shellpoint"), no LEI linkage, no ingest vintage metadata, and nominal dollars mixed across decades. Evolution A turns the evidence layer into a calibrated counterparty-misconduct score usable by SFDR PAI 10/11 and CSDDD screening modules.

**How.** (1) Entity resolution: batch-match `parent_company` against `entity_lei` (GLEIF) via the platform's entity-resolution route, storing `lei` on each row so `/company/{name}` can become `/entity/{lei}` with exact joins. (2) A `misconduct_score` endpoint aggregating per-parent: penalty totals CPI-deflated to a common year, recency-weighted violation counts, severity mix, and the stored `repeat_offender` flag — weights documented per Atlas §8 model-card convention. (3) Benchmark: rank-correlate scores against an external controversy rating sample for the overlapping names; publish the correlation rather than asserting validity. (4) `GET /stats` gains `source_snapshot_date` and coverage counts (the missing `last_updated` metadata route).

**Prerequisites.** Populated `entity_lei` (GLEIF bulk ingest verified); the ingestion pipeline must expose its snapshot date; the `repeat_offender` definition documented at ingest (it is opaque to this code today). **Acceptance:** searching "Shell" no longer returns Shellpoint under LEI-exact mode; two parents with identical nominal penalties in 1995 vs 2024 score differently; score components sum reproducibly to the published total.

### 9.2 Evolution B — Counterparty adverse-media screen for the due-diligence desk (LLM tier 2)

**What.** The endpoint set is a natural tool belt for a screening analyst: given a counterparty name, the LLM calls `/search`, `/company/{name}`, and `/stats`, then drafts the adverse-track-record paragraph a CSDDD/UNGC due-diligence memo requires — every count and dollar figure from the SQL results, with the ILIKE over-match caveat surfaced rather than hidden.

**How.** All seven routes are read-only, viewer-role GETs — auto-generate tool schemas from OpenAPI with no confirmation gating. The per-module system prompt embeds §7.3's NULL semantics (pending cases counted but excluded from sums) so the copilot explains why totals and counts diverge instead of "correcting" them. When name matching is ambiguous, the copilot must enumerate the distinct `parent_company` values returned and ask the user to pick, not silently merge. Output composes into the Tier-3 counterparty-assessment chain (GLEIF resolve → sanctions → violations → physical risk) already sketched in the roadmap.

**Prerequisites.** None hard for a first slice — the read surface works today (six of seven traces passed; `/company/{name}` 404s only on empty match). Evolution A's LEI linkage upgrades match precision later. **Acceptance:** a generated screening paragraph cites only figures present in tool outputs; for "Shell" it discloses the multiple distinct parents matched; a name with zero rows yields "no enforcement records found in dh_violation_tracker", never an invented history.