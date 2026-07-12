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
