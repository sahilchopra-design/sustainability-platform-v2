# Counterparty Ownership Graph
**Module ID:** `counterparty-ownership-graph` · **Route:** `/counterparty-ownership-graph` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `EntityChip`, `Kpi`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `rollup` | `useMemo(() => { const rows = groupEntities.map((e) => { const exp = Number(exposures[e.lei]) \|\| 0;` |
| `total` | `rows.reduce((s, r) => s + r.attributed, 0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/gleif/ping` | `ping` | api/v1/routes/gleif_graph.py |
| GET | `/api/v1/gleif/search` | `search` | api/v1/routes/gleif_graph.py |
| GET | `/api/v1/gleif/entity/{lei}` | `entity` | api/v1/routes/gleif_graph.py |
| GET | `/api/v1/gleif/typeahead` | `typeahead` | api/v1/routes/gleif_graph.py |
| GET | `/api/v1/gleif/resolve-by-isin/{isin}` | `resolve_by_isin` | api/v1/routes/gleif_graph.py |
| GET | `/api/v1/gleif/resolve-by-bic/{bic}` | `resolve_by_bic` | api/v1/routes/gleif_graph.py |

### 2.3 Engine `gleif_upsert` (services/gleif_upsert.py)
| Function | Args | Purpose |
|---|---|---|
| `fetch_lei_record_by_isin` | isin | Return the single raw lei-records resource matching filter[isin], or None. |
| `fetch_lei_record_by_bic` | bic | Return the single raw lei-records resource matching filter[bic], or None. NOTE (verified live 2026-07-05): GLEIF's bic filter requires the FULL BIC including branch/XXX suffix (e.g. "DEUTDEFFXXX", not "DEUTDEFF") -- an 8-char bank-only BIC returns zero results even though it's a real BIC. |
| `fetch_lei_record_by_lei` | lei | Return the single raw lei-records resource for an exact LEI, or None. |
| `fetch_fuzzy_completions` | name, limit | Ranked name completions via GLEIF /fuzzycompletions?field=entity.legalName. Returns [{"value": str, "lei": str/None}, ...]. Chosen over /autocompletions for this fallback because fuzzycompletions consistently links every completion to an lei-records id (autocompletions sometimes returns bare free-text completions with no LEI relationship at all -- confirmed live 2026-07-05, see gleif_graph.py's /t |
| `transform_gleif_record` | raw_record | Transform ONE raw GLEIF lei-records JSON:API resource into an entity_lei row dict, by delegating to GleifIngester.transform() so the JIT upsert path can never drift from the weekly bulk ingester's field mapping. Returns None if the record has no LEI or legal name (mirrors GleifIngester.validate()'s skip condition). |
| `upsert_lei_record` | conn_or_session, raw_record | Transform + upsert a single raw GLEIF lei-records resource into entity_lei using the exact same ON CONFLICT SQL as the bulk ingester (ENTITY_LEI_UPSERT_SQL, imported from ingestion/gleif_ingester.py). `conn_or_session` may be a SQLAlchemy Session (route layer, via Depends(get_db)) or a raw Connection (service layer, via Engine.connect()) -- both support .execute(stmt, params) + .commit() under SQL |
| `resolve_and_upsert_by_isin` | conn_or_session, isin | Live GLEIF ISIN lookup + immediate upsert into entity_lei. None if no match. |
| `resolve_and_upsert_by_bic` | conn_or_session, bic | Live GLEIF BIC lookup + immediate upsert into entity_lei. None if no match. |
| `resolve_and_upsert_by_name` | conn_or_session, name | Live GLEIF name resolution: fuzzycompletions -> top-ranked LEI -> full lei-records fetch -> upsert into entity_lei. None if no completion carries an LEI link. |

**Engine `gleif_upsert` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_HEADERS` | `{'Accept': 'application/vnd.api+json'}` |
| `_TIMEOUT` | `25` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

**Database tables:** `__future__` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `entity_lei`, `exc` *(shared)*, `fastapi` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **81** other module(s).

| Connected module | Shared via |
|---|---|
| `supply-chain-esg-hub` | table:exc, table:sqlalchemy |
| `supply-chain-resilience` | table:exc, table:sqlalchemy |
| `climate-underwriting-workbench` | table:exc, table:sqlalchemy |
| `supply-chain-contagion` | table:exc, table:sqlalchemy |
| `supply-chain-emissions-mapper` | table:exc, table:sqlalchemy |
| `supply-chain-carbon` | table:exc, table:sqlalchemy |
| `supply-chain-map` | table:exc, table:sqlalchemy |
| `insurance-transition` | table:exc, table:sqlalchemy |
| `insurance-protection-gap` | table:exc, table:sqlalchemy |
| `api-gateway-monitor` | table:exc, table:sqlalchemy |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Counterparty Ownership Graph is a thin proxy over the **GLEIF (Global Legal Entity
Identifier Foundation) LEI API** (`api.gleif.org`, free, keyless, CC0 1.0) that
(1) fuzzy-searches the global LEI registry, (2) walks a real corporate-ownership
relationship graph (direct/ultimate parent + a bounded direct-parent chain + direct
children), and (3) rolls user-entered financed-emissions/credit exposures up that
real ownership tree using a **PCAF-style attribution factor** the user supplies.

The ownership tree data (entity records, parent/child relationships, reporting
exceptions) is 100% live GLEIF golden-copy data — there is no fabrication in that
layer. The attribution rollup math is the one genuinely computed piece, and it runs
entirely client-side against user-entered numbers.

### 7.2 Backend proxy mechanics

`backend/api/v1/routes/gleif_graph.py` exposes four routes, all backed by a 6-hour
in-process TTL cache (`_CACHE_TTL = 6*3600`, bounded to 4096 entries, cleared when
full):

| Route | Upstream call(s) |
|---|---|
| `GET /api/v1/gleif/ping` | `GET /lei-records?page[size]=1` (health check) |
| `GET /api/v1/gleif/search?q=` | `GET /lei-records?filter[fulltext]=<q>` |
| `GET /api/v1/gleif/entity/{lei}` | `GET /lei-records/{lei}` + `/direct-parent` + `/ultimate-parent` + up to 8× `/direct-parent` (chain walk) + `/direct-children` + `/direct-parent-reporting-exception` + `/ultimate-parent-reporting-exception` (only when no parent is reported) |

`_slim()` reduces each GLEIF JSON:API resource down to `lei`, `name`,
`jurisdiction`, `entity_status`, `entity_category`, `legal_form_id`,
`legal_address`, `headquarters_country`, `registration_status`,
`next_renewal_date`, `managing_lou` — the fields the ownership-tree UI actually
renders.

**Bounded parent-chain walk** (the one piece of real logic beyond field-slimming):
```python
chain: List[dict] = []
seen = {lei}
cursor = lei
for _ in range(8):                      # hard cap: 8 hops
    hop = _cached_get(f"/lei-records/{cursor}/direct-parent")
    if not hop or not hop.get("data"):
        break                            # 404 = "no parent reported" (terminal)
    parent = _slim(hop["data"])
    if not parent["lei"] or parent["lei"] in seen:
        break                            # cycle guard
    chain.append(parent)
    seen.add(parent["lei"])
    cursor = parent["lei"]
```
This walks `direct-parent` repeatedly (not `ultimate-parent` directly) so the UI can
render every intermediate holding-company layer, ordered nearest-parent-first, with
a cycle guard (`seen` set) and an 8-hop cap to bound worst-case latency (up to 9
sequential upstream calls: entity + up to 8 parent hops, each individually
cacheable).

A GLEIF 404 on a relationship endpoint is a **meaningful business answer** ("no
parent reported"), not an error — the code explicitly maps it to `data = None`
rather than raising, then surfaces the *reason* via the reporting-exception
endpoints (RR-CDF categories such as NATURAL_PERSONS, CONSOLIDATING_ENTITY, etc.).

### 7.3 PCAF attribution rollup (frontend)

```js
groupEntities = [self, ...parent_chain (nearest-first, dedup by LEI), ...direct_children]
attributed(e) = Number(exposures[e.lei] || 0) × attrFactor
groupTotal = Σ over groupEntities of attributed(e)
```
`attrFactor` is a single scalar (default 1.0, user-adjustable 0–1) applied uniformly
to every entity in the group — the UI documents this as "PCAF: outstanding ÷
enterprise value, entered here directly," i.e. the user is expected to have already
computed their own attribution factor(s) per PCAF's standard financed-emissions
methodology; the module does not derive EVIC or outstanding-amount ratios itself,
it only multiplies exposure × the supplied factor and sums across the group.

### 7.4 Worked example

Search "Siemens" (the page's default query) → select the parent LEI → suppose the
loaded entity graph has: self (exposure seeded to $100M on load), one parent in the
chain (analyst enters $50M), and one direct child (analyst enters $30M), with
`attrFactor = 0.6`:

| Entity | Role | Exposure $M | Attributed $M (`exposure × 0.6`) |
|---|---|---|---|
| Self | self | 100 | 60.0 |
| Parent Co | parent | 50 | 30.0 |
| Subsidiary Co | child | 30 | 18.0 |
| **Group total** | — | 180 | **108.0** |

`rollup.total = Σ attributed = 60.0 + 30.0 + 18.0 = 108.0` — a simple linear scaling
that "rolls to the ultimate parent" only in the sense that every entity discovered
in the graph (self + full parent chain + first page of children) is summed into one
group figure; it is not a hierarchical apportionment that avoids double-counting
across levels (the raw sum overlaps if, e.g., a child's exposure is really a subset
of the parent's consolidated balance sheet — a limitation the page does not flag
explicitly beyond noting the attribution factor is user-entered).

### 7.5 Live/Demo status logic

The `pingStatus` badge starts `loading`, resolves to `live` if
`GET /api/v1/gleif/ping` reports `reachable: true`, and independently flips to
`demo` if any subsequent `/search` or `/entity/{lei}` call throws — so the badge
reflects real-time reachability of the upstream, not a cached assumption.

### 7.6 Companion UI

- **Direct-parent-exception banner**: when no direct parent is reported, the page
  surfaces GLEIF's own stated reason (e.g. a natural-person ownership exemption)
  rather than silently showing an empty parent slot.
- **Children pagination note**: shows "`returned` of `total`" so a 200-subsidiary
  conglomerate visibly caps at `children_limit` (default 50, max 200) without
  claiming completeness.

### 7.7 Data provenance & limitations

- **All ownership-tree data is live GLEIF golden-copy data** (CC0 1.0) — entity
  records, jurisdiction, registration status, and RR-CDF parent/child
  relationships are exactly what GLEIF reports, subject to the 6h cache.
- **Fuzzy search quality is GLEIF's own** (`filter[fulltext]`) — the proxy performs
  no additional ranking or disambiguation.
- **PCAF attribution is not computed from real financial data** — exposures and
  the attribution factor are both freeform user inputs; the module supplies no
  EVIC, outstanding-debt, or enterprise-value reference data to ground the factor.
- The 8-hop parent-chain cap and 200-record children cap mean extremely deep or
  wide corporate groups will be truncated (documented via the "returned of total"
  children counter, but not for the parent-chain depth cap).
- Group-total rollup can double-count exposure across ownership levels since it is
  a flat sum, not a consolidation-aware apportionment.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Let a credit/financed-emissions analyst locate a
counterparty in the global LEI system, see its real legal-ownership structure up to
the ultimate parent and down to direct subsidiaries, and produce a quick
group-level attributed-exposure rollup for PCAF-style financed-emissions reporting.

**8.2 Conceptual approach.** GLEIF's RR-CDF (Relationship Record — Common Data
File) relationship records are the ground truth for corporate hierarchy; the
module purely displays that graph (with a bounded walk for depth) and adds one
linear scaling step (attribution factor × exposure) that mirrors, but does not
independently validate, the PCAF attribution-factor definition
(`outstanding_amount ÷ EVIC_or_total_equity+debt`).

**8.3 Mathematical specification.**
```
attributed_exposure(e) = exposure(e) × attribution_factor
group_total = Σ_{e ∈ {self} ∪ parent_chain ∪ direct_children} attributed_exposure(e)
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Attribution factor | `attrFactor` | User-entered; PCAF standard defines it as outstanding amount ÷ EVIC (or total equity + debt for private companies) — not computed here |
| Parent-chain depth cap | 8 hops | Backend-enforced bound on `direct-parent` walk latency/cycles |
| Children page size | `children_limit` (default 50, max 200) | Query parameter, bounds worst-case payload |
| Cache TTL | 6h | Matches GLEIF's daily golden-copy update cadence |

**8.4 Data requirements.** A valid 20-character alphanumeric LEI to seed the search;
everything else (jurisdiction, status, relationships) is fetched live. Attribution
requires the analyst to separately source outstanding exposure and enterprise value
per PCAF Part A methodology — this module does not ingest either.

**8.5 Validation & benchmarking.** GLEIF endpoint behavior verified live 2026-07-04
(`/lei-records`, `/direct-parent`, `/ultimate-parent`, `/direct-children`,
`*-reporting-exception` all responding as documented, including meaningful 404s for
"no parent reported"). No independent benchmarking of the attribution rollup exists
since it is a direct scalar multiplication, not a fitted or calibrated model.

**8.6 Limitations & model risk.** Treat the group-total rollup as directional, not
a PCAF-compliant financed-emissions number — it lacks (a) EVIC/outstanding-amount
derivation, (b) consolidation logic to prevent double-counting across ownership
tiers, and (c) any emissions data at all (this module surfaces exposure rollups,
not financed emissions itself — WACI/EVIC integration lives in the platform's PCAF
Financed Emissions module, not here). Corporate groups deeper than 8 parent hops or
wider than 200 direct subsidiaries will be silently truncated in the graph view.

## 9 · Future Evolution

### 9.1 Evolution A — Ground the attribution rollup in reference financials (analytics ladder: rung 1 → 2)

**What.** This module is honest infrastructure: a thin, well-built proxy over the
live GLEIF API (CC0 golden-copy ownership data, bounded 8-hop parent walk with cycle
guard, exception banners, "returned of total" pagination honesty — §8 status
"implemented"). Its documented limitation (§7.7) is the analytic layer: the
PCAF-style exposure rollup runs on freeform user inputs — the module supplies no
EVIC, outstanding-debt, or enterprise-value data to ground the attribution factor,
so the one computed number rests on typed guesses. Evolution A grounds it.

**How.** (1) Financial reference join: resolve the LEI to listed-entity financials
via the OpenFIGI mapping the platform already integrated (wave 1) plus the
`company-profiles` real dataset where covered, giving EVIC/total-debt candidates for
the attribution denominator with a `resolution_tier` label (exact PCAF data-quality
scoring conventions apply). (2) Persist rollups: exposures and attribution runs move
from client state to a table keyed by LEI, so a counterparty's tree and its
attributed exposure become a retrievable artifact other modules can consume — with
blast radius 81, this graph is already the platform's entity spine. (3) Tree-level
analytics: aggregate exposure by ultimate parent with double-count protection when a
user enters exposures at multiple levels of the same chain — currently possible and
silently additive. (4) Sanctions/adverse-flag overlay via the existing
entity-resolution routes as an optional decoration.

**Prerequisites.** GLEIF bulk table (`entity_lei`) freshness — the silently-broken
bulk ingester found in the data-sources project must stay fixed and scheduled;
OpenFIGI coverage honesty (unlisted subsidiaries get honest nulls).
**Acceptance:** an attribution run for a listed counterparty shows its EVIC source
and tier; entering exposures at both parent and subsidiary levels triggers the
double-count warning; rollups persist across sessions.

### 9.2 Evolution B — Counterparty-resolution copilot for the whole platform (LLM tier 2 → 3)

**What.** "Assess this counterparty" is the roadmap's own tier-3 example, and this
module owns the first hop. Evolution B: a copilot that takes a messy name ("Glencore
trading arm, Swiss entity?") and drives `GET /gleif/search` and `/entity/{lei}` to
resolve, disambiguate (presenting GLEIF candidates with jurisdiction/status, asking
one clarifying question when fulltext search is ambiguous rather than guessing),
then walks the tree and narrates the structure: ultimate parent, chain depth,
reporting exceptions in plain language ("no parent reported — natural-person
ownership exemption"), and attributed exposure if entered. As tier 3, it hands the
resolved LEI to sibling modules (sanctions screen, physical-risk profile, financed
emissions) per the desk-orchestration pattern.

**How.** Tool schemas over the 6 GLEIF routes (all read-only, already live);
grounding is §7's mechanics documentation so the copilot explains caps honestly
(8-hop truncation, 50-children default). The key prompt rule: entity facts come only
from GLEIF responses — the model's training-data knowledge of corporate structures
is explicitly untrusted, since ownership changes constantly and the live registry is
the whole point.

**Prerequisites.** None hard — this is the platform's most ship-ready tier-2
candidate (live endpoints, zero fabrication surface); tier-3 handoffs need the Atlas
endpoint map for target modules. **Acceptance:** resolution of 10 ambiguous test
names asks clarifying questions rather than mis-resolving; every entity fact in a
narration appears in a tool response; truncated trees are described as truncated.