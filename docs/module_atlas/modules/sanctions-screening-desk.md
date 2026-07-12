# Sanctions Screening Desk
**Module ID:** `sanctions-screening-desk` · **Route:** `/sanctions-screening-desk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Kpi`, `LS_KEY`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `label` | `mode.startsWith('live-keyed') ? '● Live — CSL keyed search'` |
| `persistLog` | `(entries) => { setLog(entries); try { localStorage.setItem(LS_KEY, JSON.stringify(entries.slice(0, 200))); } catch { /* ignore */ } };` |
| `names` | `input.split('\n').map((s) => s.trim()).filter(Boolean);` |
| `hits` | `(data.results \|\| []).reduce((s, r) => s + (r.csl_matches?.length \|\| 0) + (r.uflpa_matches?.length \|\| 0), 0);` |
| `lines` | `prev.split('\n').map((s) => s.trim()).filter(Boolean);` |
| `totalHits` | `(resp?.results \|\| []).reduce((s, r) => s + (r.csl_matches?.length \|\| 0) + (r.uflpa_matches?.length \|\| 0), 0);` |
| `flaggedNames` | `(resp?.results \|\| []).filter((r) => (r.csl_matches?.length \|\| 0) + (r.uflpa_matches?.length \|\| 0) > 0).length;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/sanctions/status` | `status` | api/v1/routes/sanctions_screening.py |
| POST | `/api/v1/sanctions/screen` | `screen` | api/v1/routes/sanctions_screening.py |
| GET | `/api/v1/sanctions/uflpa-list` | `uflpa_list` | api/v1/routes/sanctions_screening.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `XUAR` *(shared)*, `__future__` *(shared)*, `datetime` *(shared)*, `dhs` *(shared)*, `fastapi` *(shared)*, `pathlib` *(shared)*, `persons` *(shared)*, `pydantic` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sanctions/status** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['csl_search_api', 'csl_bulk_download', 'csl_snapshot_loaded', 'csl_snapshot_rows', 'csl_snapshot_origin', 'csl_snapshot_on_disk', 'csl_last_error', 'csl_source_lists', 'uflpa', 'matching_logic', 'checked_at'], 'n_keys': 11}`

**GET /api/v1/sanctions/uflpa-list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['meta', 'entities'], 'n_keys': 2}`

**POST /api/v1/sanctions/screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **7** other module(s).

| Connected module | Shared via |
|---|---|
| `sanctions-climate-finance` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `platform-analytics` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `sanctions-trade-monitor` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `sanctions-watchlist` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `energy-transition-credit-portal` | table:pathlib |
| `module-navigator` | table:pathlib |
| `infra-debt-portfolio-manager` | table:pathlib |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Sanctions & UFLPA Screening Desk screens free-text supplier/counterparty names
against two real reference lists: the U.S. **trade.gov Consolidated Screening List**
(CSL — 12 U.S. government lists including OFAC SDN/SSI/CMIC, BIS Entity
List/DPL/UVL/MEU, State ISN/DTC) and the **DHS UFLPA Entity List** (forced-labor
Section 2(d)(2)(B) designations). It returns per-name match lists with a documented
confidence score, not a binary pass/fail — this is explicitly a **screening aid**,
not a compliance determination (stated in the API response's `disclaimer` field and
repeated in the UI).

### 7.2 Data sources — three CSL access tiers, one UFLPA extract

`backend/api/v1/routes/sanctions_screening.py` implements a documented fallback
chain for the CSL:

1. **`live-keyed-search`** — if `TRADE_GOV_API_KEY` is set, calls
   `GET https://data.trade.gov/consolidated_screening_list/v1/search` with
   `fuzzy_name=true` (trade.gov's own server-side fuzzy matching, confidence taken
   from trade.gov's `score` field ÷ 100, capped at 1.0).
2. **`live-bulk-snapshot`** (default, no key needed) — downloads
   `https://data.trade.gov/downloadable_consolidated_screening_list/v1/consolidated.csv`
   (keyless, verified ~16.5MB / 25,830 entries), caches it to disk + memory with a
   24h TTL, and screens locally using the module's own name-matching algorithm
   (§7.3).
3. **`demo-seed`** — if both the keyed API and the keyless bulk download fail, falls
   back to a 5-row hand-copied real extract (`CSL_DEMO_SEED` — Huawei, Rosneft Oil
   Company, Sberbank, IRGC, Rosneft Trading S.A., each copied verbatim from the
   trade.gov CSV on 2026-07-04) so the demo still screens against real sanctioned
   entities rather than placeholders.

The **UFLPA Entity List is not part of the CSL** (the docstring notes this was
verified: zero UFLPA-source rows in the bulk file) and is published only as a DHS
web page / Federal Register notices, not an API — so the module ships a
**hand-authored extract of 23 of the ~144 real listed entities**
(`UFLPA_ENTITY_LIST_SEED`), covering the June 2022 inaugural list through June 2024
additions, each with its real listing basis paraphrased from FLETF notices (e.g.
Hoshine Silicon Industry, Ninestar Corporation, Camel Group).

### 7.3 Name normalization + matching algorithm (verbatim from source)

```python
def _normalize(name):
    s = unicodedata.normalize("NFKD", name)          # NFKD decompose
    s = "".join(ch for ch in s if not unicodedata.combining(ch))  # strip accents
    s = s.casefold().replace("&", " and ")
    s = _NON_ALNUM.sub(" ", s)                        # non-alphanumeric -> space
    return " ".join(s.split())                        # collapse whitespace

def _tokens(norm):
    return frozenset(t for t in norm.split() if t not in _CORP_SUFFIXES)
    # _CORP_SUFFIXES: ltd, llc, gmbh, co, corp, inc, ag, sa, plc, pte, kk,
    #                 ooo, oao, zao, pjsc, ojsc, jsc, group, holding, ... (33 forms)

def _score(query_norm, query_tokens, cand_norm, cand_tokens):
    if query_norm == cand_norm:
        return 1.0, "exact"
    shorter = min(len(query_norm), len(cand_norm))
    if shorter >= 5 and (query_norm in cand_norm or cand_norm in query_norm):
        return 0.85, "strong (substring)"
    inter = len(query_tokens & cand_tokens); union = len(query_tokens | cand_tokens)
    j = inter / union if union else 0
    if j >= 0.5:
        return round(0.50 + 0.45 * j, 3), "possible (token overlap)"
    return None
```
Every list entry is compared against its **primary name and every alias/alt name**;
the best-scoring field wins (`_best_match`). Results are sorted descending by
confidence and capped at `_MAX_MATCHES_PER_NAME = 10`.

### 7.4 Worked examples — all three confidence tiers, hand-traced

**(a) Exact match (confidence 1.00).** Query `"Rosneft"` vs the CSL demo-seed entry
whose `alt_names` includes `"Rosneft"`:
`_normalize("Rosneft") = "rosneft"`; the alias normalizes to the identical string
`"rosneft"` → `query_norm == cand_norm` → **confidence 1.00, "exact"**. (The primary
name "Open Joint-Stock Company Rosneft Oil Company" would only have scored 0.85 via
substring containment — the alias match wins because `_best_match` keeps the
highest score across all candidate fields.)

**(b) Strong substring match (confidence 0.85).** Query `"Rosneft Trading"` vs CSL
entry `"ROSNEFT TRADING S.A."`:
`_normalize("Rosneft Trading") = "rosneft trading"` (16 chars);
`_normalize("ROSNEFT TRADING S.A.") = "rosneft trading s a"` (the two periods in
"S.A." become spaces via `_NON_ALNUM`). `query_norm` (16 chars, ≥5) is a substring
of `cand_norm` → **confidence 0.85, "strong (substring)"**.

**(c) Possible/token-overlap match (confidence 0.725).** Query
`"Hetian Taida Trading"` vs UFLPA entry `"Hetian Taida Apparel Co., Ltd."`:
- `query_tokens = {hetian, taida, trading}` (3 tokens, none are corporate suffixes)
- `cand_norm = "hetian taida apparel co ltd"` → `cand_tokens = {hetian, taida,
  apparel}` ("co" and "ltd" are stripped as corporate suffixes)
- `inter = {hetian, taida}` → 2; `union = {hetian, taida, trading, apparel}` → 4
- `j = 2/4 = 0.5` → passes the `j >= 0.5` gate
- `confidence = 0.50 + 0.45 × 0.5 = 0.725` → **"possible (token overlap)"**

These three hand-traced cases reproduce exactly the confidence bands the UI colors
(`confColor`: ≥1.00 red "EXACT", ≥0.85 orange "STRONG", else amber "POSSIBLE").

### 7.5 UFLPA screening

`_screen_uflpa()` runs the identical `_normalize`/`_tokens`/`_score` pipeline
against `UFLPA_ENTITY_LIST_SEED`'s `name` + `aliases` fields — same algorithm, a
separate 23-entity list. Query "Xinjiang Production and Construction Corps" against
the seed's first entry produces an **exact** match (confidence 1.00) since the
query string is copied verbatim from the real DHS listing name.

### 7.6 Batch screening + audit log

`POST /screen` accepts either a single `name` or a `names` array (max 200,
`_MAX_BATCH`), screens each name against both lists independently, and returns
`csl_mode` per name (it can degrade mid-batch, e.g. `"live-bulk-snapshot (keyed
search failed)"` if the keyed path throws partway through). The frontend persists a
local-only audit trail (`localStorage`, key `sanctions_screening_audit_log_v1`) of
timestamp/name-count/hit-count/mode per screening run — client-side only, not
server-persisted.

### 7.7 Data provenance & limitations

- **CSL bulk data is genuinely live** when reachable — the keyless 25,830-row CSV
  download is the *default* path (no key required), refreshed daily (24h TTL,
  disk + memory cached, "serve stale on download failure" behavior identical in
  spirit to the grid-carbon and GLEIF proxies elsewhere in this module family).
- **UFLPA is a hand-authored, dated extract** (23 of ~144 entities, "June 2022
  inaugural list through June 2024 additions") — the module explicitly states this
  needs refreshing from `dhs.gov/uflpa-entity-list` for production use, since the
  list is amended several times a year via Federal Register notices and there is
  no API to pull it live.
- **This is a screening aid, not a compliance determination** — stated directly in
  the API's `disclaimer` field: "Positive matches require manual review against the
  authoritative lists ... before any compliance action."
- The matching algorithm has no phonetic (Soundex/Metaphone), transliteration, or
  cross-script (e.g. Cyrillic/Chinese-name-romanization-variant) handling beyond
  simple NFKD accent-stripping — it will miss matches where a name is romanized
  differently across sources even though the underlying entity is the same.
- Country extraction from the bulk CSV is heuristic (`_parse_csl_csv`: "crude
  country extraction: last comma-token of each address segment, if 2 letters") and
  can misfire on malformed or non-standard address strings.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Give trade-compliance and supply-chain risk teams a fast,
transparent first-pass screen of counterparty/supplier names against the real U.S.
CSL and DHS UFLPA lists, with an explainable, deterministic confidence score rather
than an opaque ML matcher.

**8.2 Conceptual approach.** Classic normalized-string + token-set matching
(casefold, accent-strip, punctuation removal, corporate-suffix stripping, then
exact / substring / Jaccard-overlap tiers) — chosen specifically for explainability:
every match result states which rule fired and against which candidate field
(primary name vs a named alias), so a compliance analyst can audit *why* a hit
occurred.

**8.3 Mathematical specification.**
```
normalize(s)  = collapse_ws(sub_nonalnum(casefold(strip_accents(NFKD(s))).replace("&"," and ")))
tokens(s)     = { w ∈ normalize(s).split() : w ∉ CORP_SUFFIXES }
score(q, c):
  if norm(q) == norm(c):                         return 1.00  "exact"
  if min(|norm(q)|,|norm(c)|) >= 5 and substring: return 0.85  "strong (substring)"
  j = |tokens(q) ∩ tokens(c)| / |tokens(q) ∪ tokens(c)|
  if j >= 0.5:                                   return 0.50 + 0.45·j   "possible"
  else:                                          return None (no match)
best_match(q, entry) = max over {primary_name} ∪ aliases of score(q, candidate)
```
| Parameter | Value | Basis |
|---|---|---|
| Substring floor | 5 characters | Avoids trivial false positives from very short common words |
| Jaccard threshold | 0.5 | Requires at least half of the smaller token set to overlap |
| Possible-tier formula | `0.50 + 0.45·j` | Maps j∈[0.5,1.0] onto confidence∈[0.725,0.95], keeping "possible" strictly below the 0.85 "strong" floor except at j=1.0 |
| Corporate-suffix list | 33 forms (ltd, llc, gmbh, ag, sa, plc, pjsc, ...) | Common multi-jurisdiction legal-form abbreviations |
| Max matches/name | 10 | `_MAX_MATCHES_PER_NAME` |
| Batch cap | 200 names | `_MAX_BATCH` |

**8.4 Data requirements.** No user-supplied reference data needed — the CSL bulk
CSV and UFLPA seed ship with the platform. Optional `TRADE_GOV_API_KEY` env var
upgrades the CSL path to trade.gov's own server-side fuzzy search.

**8.5 Validation & benchmarking.** Verified 2026-07-04 that the keyless bulk CSV
endpoint returns HTTP 200 with ~25,830 real entries and that the UFLPA list is
genuinely absent from that file (motivating the separate hand-authored extract).
Matching-tier behavior was hand-traced end-to-end in §7.4 against real CSL/UFLPA
entries and reproduces the documented confidence bands exactly.

**8.6 Limitations & model risk.** No phonetic or cross-script transliteration
matching; heuristic (not authoritative) country parsing from CSV addresses; UFLPA
coverage is a dated 23/~144-entity extract requiring manual refresh; false negatives
are likely for entities known by a materially different name/alias not present in
either source list. The tool is explicitly scoped as a screening aid — all hits
require manual verification against the authoritative trade.gov/dhs.gov lists
before any compliance action, per the API's own disclaimer.

## 9 · Future Evolution

### 9.1 Evolution A — Automated UFLPA refresh and multi-list expansion (analytics ladder: rung 2 → 3)

**What.** This is the sanctions cluster's real engine: live screening of free-text names against the trade.gov Consolidated Screening List (25,830 rows, keyless daily download, disk+memory cached with serve-stale fallback) and the DHS UFLPA Entity List, returning confidence-scored matches with an explicit screening-aid disclaimer — honest by design. Its documented weak point (§7.7): the UFLPA side is a hand-authored extract of 23 of ~144 entities, dated "through June 2024", which the module itself says needs refreshing since the list is amended several times a year via Federal Register notices. Evolution A automates that refresh and extends coverage.

**How.** (1) UFLPA ingester: scheduled scrape/parse of the DHS UFLPA Entity List page (structured HTML table) into a versioned reference table with addition dates and Federal Register citations, replacing the static extract; diffs between versions logged so screeners can see what changed. (2) Add the EU and UK OFSI consolidated lists (both published as open CSV/XML) as additional screening sources with per-list provenance in match results — turning a US-centric desk into the multi-regime screen the sibling `sanctions-trade-monitor` describes but doesn't implement. (3) Matching quality: alias/AKA expansion (CSL carries alt-names — ensure they're indexed), transliteration-tolerant scoring for Cyrillic/Chinese-origin names, with match-score calibration documented against a hand-labelled test set. (4) Batch screening endpoint for portfolio-scale runs feeding the sibling modules' evolutions.

**Prerequisites.** Ingester scheduling (the platform's 19-ingester framework is the scaffold); labelled match test set (~100 name pairs). **Acceptance:** UFLPA table matches the live DHS list on spot check with version history; EU/UK matches carry list provenance; precision/recall on the labelled set is published in the module docs, not asserted.

### 9.2 Evolution B — Match-adjudication assistant (LLM tier 2)

**What.** The desk's output is match lists a human must adjudicate — the bottleneck is reading. The assistant accelerates it: "for these 6 medium-confidence matches, summarize the evidence for and against identity — name similarity, jurisdiction, list program, entity type — and rank by adjudication priority", turning a raw match list into a structured review queue. The disclaimer discipline the module already encodes (screening aid, not determination) is the assistant's constitution.

**How.** Tier-2 tool calls to the screening endpoints plus entity enrichment via the platform's GLEIF resolution (a match candidate with a resolvable LEI and different registered jurisdiction is evidence against identity — a genuinely useful automated check). Evidence summaries quote list-entry fields verbatim; the for/against structure is a template, not free reasoning, keeping outputs auditable. Adjudication decisions are recorded by the human; the assistant's suggestion and the decision are both logged (an `llm_traces`-style record), building the calibration dataset for future match-score tuning. No clear/block language ever.

**Prerequisites.** Evolution A's alias indexing and GLEIF cross-check plumbing; adjudication-log schema. **Acceptance:** every evidence item quotes a real list or GLEIF field; suggestions and human decisions are logged pairwise; outputs contain the disclaimer and no determination language.