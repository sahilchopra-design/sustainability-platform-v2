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
