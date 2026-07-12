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
