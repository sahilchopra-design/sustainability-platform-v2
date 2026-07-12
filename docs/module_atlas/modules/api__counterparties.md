# Api::Counterparties
**Module ID:** `api::counterparties` · **Route:** `/counterparties` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/counterparties` | `list_counterparties` | api/v1/routes/counterparties.py |
| GET | `/counterparties/{counterparty_id}` | `get_counterparty` | api/v1/routes/counterparties.py |
| POST | `/counterparties` | `create_counterparty` | api/v1/routes/counterparties.py |
| PATCH | `/counterparties/{counterparty_id}` | `update_counterparty` | api/v1/routes/counterparties.py |
| DELETE | `/counterparties/{counterparty_id}` | `delete_counterparty` | api/v1/routes/counterparties.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `api` *(shared)*, `counterparty`, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /counterparties** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /counterparties/{counterparty_id}** — status `failed`, provenance ['db-empty'], source tables: `portfolios`
Output: `None`

**POST /counterparties** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**PATCH /counterparties/{counterparty_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**DELETE /counterparties/{counterparty_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/api/v1/routes/counterparties.py` — a pure CRUD route module with **no analytics
engine**; there is no `backend/services/*` component behind it.)*

### 7.1 What the module computes

Nothing quantitative. This domain is the platform's counterparty master-data CRUD surface at
`/counterparties`:

| Endpoint | Behaviour |
|---|---|
| `GET /counterparties` | Paginated list with optional case-insensitive name search |
| `GET /counterparties/{id}` | Single record fetch (404 when absent) |
| `POST /counterparties` | Create (name + description), returns 201 |
| `PATCH /counterparties/{id}` | Partial update via `model_dump(exclude_unset=True)` |
| `DELETE /counterparties/{id}` | Delete, returns a `MessageResponse` |

The only formula in the file is the page-count computation used by the paginated response:

```python
total_pages = (total + page_size - 1) // page_size   # ceiling division
```

### 7.2 Parameterisation

There are no constants, weights or thresholds. Query parameters:

| Parameter | Semantics | Source |
|---|---|---|
| `search` | substring match, `search.lower() in c.name.lower()` | route code |
| `pagination` | `PaginationParams` dependency (skip/limit/page/page_size) | `api/v1/deps.py` |

Response schema (`CounterpartyResponse`): `id`, `name`, `description`, `created_at`,
`updated_at` — no risk, sector, rating or emissions attributes are carried at this layer.

### 7.3 Calculation walkthrough

`GET /counterparties` → `PortfolioRepository.get_all(skip, limit)` pulls a page from the DB,
then the optional `search` filter is applied **in Python, after pagination** — an explicitly
acknowledged shortcut (inline comment: *"Reusing Portfolio repository as counterparties share
same structure. In a real implementation, you might have a separate Counterparty model"*).
Two consequences worth documenting:

1. **Counterparties and portfolios are the same table.** Every route delegates to
   `PortfolioRepository`; a "counterparty" here is a `Portfolio` row re-labelled through
   `CounterpartyResponse`. Creating a counterparty creates a portfolio record.
2. **Search-after-pagination skew.** Because filtering happens on the already-paginated slice,
   `total` after a search reflects matches *within the fetched page*, not the whole table, and
   matching rows outside the current page are invisible. Production practice would push the
   `ILIKE` predicate into the SQL query before `LIMIT/OFFSET`.

Write paths are straightforward repository calls (`create`, `update`, `delete`) with 404
handling on missing IDs.

### 7.4 Worked example — pagination arithmetic

With 23 counterparties and `page_size = 10`:
`total_pages = (23 + 10 − 1) // 10 = 32 // 10 = 3` — pages of 10, 10 and 3 records.
If the caller then adds `search=steel` and only 2 of the 10 rows on the current page match,
the response reports `total = 2` (page-local), even if other pages contain further matches —
the §7.3 skew in action.

### 7.5 Role in the platform

Counterparty identity anchors many analytics domains (PCAF financed emissions, credit
integration, DME entity assessments), but those modules carry their own counterparty attributes
in their own tables/seeds. This route module is the thin registry layer; the richer
counterparty analytics documented elsewhere in the Atlas (e.g. `api::dme_dmi`,
`climate-credit-integration`) do not read from it at calculation time.

### 7.6 Data provenance & limitations

- **No synthetic seeded data and no PRNG** — all data is user-created via the API and stored in
  Postgres; the module fabricates nothing.
- Model reuse: no dedicated `Counterparty` ORM model; identity is shared with `Portfolio`
  (see §7.3). No uniqueness constraint on `name` is enforced at this layer.
- Search is not indexed or SQL-side; fine for demo volumes, non-scalable and
  correctness-impaired (page-local totals) at production scale.
- No soft-delete/audit trail: `DELETE` is hard removal; `updated_at` is the only change marker.
- No LEI/ISIN or external identifier fields, so entity resolution against market data must
  happen in consuming modules.

### 7.7 Framework alignment

No regulatory or quantitative framework is implemented or referenced in this module — it is
infrastructure. The closest relevant practice standards are data-governance ones: a production
counterparty master would typically align with **LEI (ISO 17442)** identification and BCBS 239
risk-data-aggregation principles (single authoritative source, lineage), neither of which is
asserted by the code. Framework logic that *consumes* counterparty data (PCAF attribution,
IFRS 9 staging, CBAM exposure) lives in the analytics domains documented in their own deep
dives.

## 9 · Future Evolution

### 9.1 Evolution A — A real Counterparty model with SQL-side search and LEI identity (analytics ladder: rung 1 → 2)

**What.** This is pure CRUD infrastructure with **no analytics engine** — the only formula is
ceiling-division page count. But §7.3 documents two real defects worth fixing before anything is
built on top: (1) **counterparties and portfolios are the same table** — every route delegates to
`PortfolioRepository`, so a "counterparty" is a re-labelled `Portfolio` row and creating one creates
a portfolio record; and (2) **search-after-pagination skew** — the `search` filter runs in Python on
the already-paginated slice, so `total` reflects matches within the fetched page only and matching
rows on other pages are invisible. The §4.2 harness shows `GET /counterparties` and `/{id}` both
**failed**. Evolution A gives counterparties a dedicated ORM model, pushes search into SQL before
LIMIT/OFFSET, and adds the LEI/ISIN identity fields the §7.6 limitations flag as missing.

**How.** A `Counterparty` model and table distinct from `Portfolio`; `list_counterparties` uses a
SQL `ILIKE` predicate so pagination totals are correct; add `lei` (ISO 17442), `isin`, sector and
country columns so consuming analytics (PCAF, IFRS 9 staging, CBAM) can resolve counterparties
without carrying their own copies. Rung 2: wire to the platform's GLEIF entity-resolution layer so a
counterparty's LEI auto-populates legal name, jurisdiction and ownership.

**Prerequisites (hard).** Fix the harness failures (§4.2) — the list and detail endpoints must
return data; the Portfolio-table reuse is a data-model bug (the inline comment admits "in a real
implementation you might have a separate Counterparty model"). Add a name-uniqueness constraint.
**Acceptance:** `total` after a search reflects whole-table matches (the §7.4 skew is gone); creating
a counterparty no longer creates a portfolio row; a counterparty carries a resolvable LEI; the list
and detail endpoints pass the harness.

### 9.2 Evolution B — Counterparty-resolution tool for the desk orchestrators (LLM tier 2)

**What.** As the platform's counterparty master, this domain's LLM role is a **shared identity/CRUD
tool** the desk orchestrators call: "add ArcelorMittal as a counterparty and resolve its LEI"
(create + GLEIF resolve), "find our steel counterparties" (SQL search), "what's this counterparty's
profile?" — so entity references across financed-emissions, CBAM and credit copilots resolve to one
authoritative record. Today the module carries no sector/rating/emissions attributes, so it is only
useful as identity infrastructure until Evolution A enriches it.

**How.** Register the CRUD endpoints as a tool; read (list/get) auto-executes, while create/update/
delete render a confirmation before writing (mutations are audit-logged via the platform middleware).
Post-Evolution A, the LEI field lets the tool bridge a counterparty to market data and the physical-
risk/Climate-TRACE facility roll-ups. The no-fabrication validator ensures any counterparty attribute
cited comes from the record, not the model's memory.

**Prerequisites (hard).** Evolution A's dedicated model, SQL search and LEI field (the current
Portfolio-reuse and page-local search make it unsafe as a resolution tool); Atlas corpus embedded
(roadmap D3); RBAC so mutations run under the user's session. **Acceptance:** a counterparty lookup
returns the authoritative record with its LEI; a "create counterparty" action requires confirmation
and does not create a portfolio row; every attribute cited traces to the stored record.