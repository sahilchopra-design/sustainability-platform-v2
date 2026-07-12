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
