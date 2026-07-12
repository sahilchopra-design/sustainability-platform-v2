# XBRL Climate Taxonomy Mapper
**Module ID:** `xbrl-climate-taxonomy` · **Route:** `/xbrl-climate-taxonomy` · **Tier:** B (frontend-computed) · **EP code:** EP-CR4 · **Sprint:** CR

## 1 · Overview
ISSB S2 XBRL taxonomy (200+ tags) and ESRS E1 ESEF tags. Tag mapping tool and filing preview.

**How an analyst works this module:**
- Taxonomy Browser shows all available XBRL tags
- Tag Mapping Tool links platform metrics to tags
- Validation Engine checks completeness and consistency
- Filing Preview renders tagged document

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `E1_CATEGORIES`, `MAPPED_STATUS`, `MAP_COLORS`, `S2_CATEGORIES`, `TABS`, `TAG_SAMPLES`, `VALIDATION_RESULTS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `S2_CATEGORIES` | 6 | `tags`, `mapped`, `validated` |
| `E1_CATEGORIES` | 7 | `tags`, `mapped`, `validated` |
| `VALIDATION_RESULTS` | 7 | `passed`, `failed`, `total` |
| `MAPPED_STATUS` | 3 | `value` |
| `TAG_SAMPLES` | 9 | `element`, `type`, `mapped` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `filteredTags` | `useMemo(() => searchTag ? TAG_SAMPLES.filter(t => t.tag.toLowerCase().includes(searchTag.toLowerCase()) \|\| t.element.toLowerCase().includes(searchTag.toLowerCase())) : TAG_SAMPLES, [searchTag]);  const totalS2 = S2_CATEGORIES.reduce((s,c)=>s+c.tags,0);` |
| `totalE1` | `E1_CATEGORIES.reduce((s,c)=>s+c.tags,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `E1_CATEGORIES`, `MAPPED_STATUS`, `MAP_COLORS`, `S2_CATEGORIES`, `TABS`, `TAG_SAMPLES`, `VALIDATION_RESULTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ISSB S2 Tags | — | IFRS Foundation | Machine-readable climate disclosure tags |
| ESRS E1 Tags | — | EFRAG | European electronic format tags |

## 5 · Intermediate Transformation Logic
**Methodology:** Taxonomy tag mapping
**Headline formula:** `Match = PlatformMetric → XBRL_Tag using semantic matching`

ISSB S2 taxonomy: 200+ tags for climate disclosure in machine-readable format. ESRS E1 ESEF: European Single Electronic Format tags. Mapping links platform data to correct XBRL tags for regulatory filing.

**Standards:** ['ISSB XBRL Taxonomy', 'ESRS ESEF']
**Reference documents:** ISSB XBRL Taxonomy; ESRS ESEF Taxonomy

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module has no backend engine and no PRNG — every number is a **static, hand-set illustrative
table**. It does not claim a scoring formula in the guide (the guide's "Match = PlatformMetric →
XBRL_Tag using semantic matching" is descriptive, not a numeric formula), so there is no formula-level
mismatch to flag; the main limitation is that "mapping"/"validation" completeness figures are
authored constants, not the output of any actual semantic-matching or validation process.

### 7.1 What the module computes

Six static reference datasets:

- **`S2_CATEGORIES`** (5 ISSB S2 sections: Governance, Strategy, Risk Management, Metrics & Targets,
  Industry Specific) — each with `tags`/`mapped`/`validated` counts (e.g. Metrics & Targets: 65 tags,
  52 mapped, 45 validated).
- **`E1_CATEGORIES`** (6 ESRS E1 sections: Transition Plan, Policies & Actions, Targets, Energy, GHG
  Emissions, Financial Effects) — same 3-count structure.
- **`VALIDATION_RESULTS`** (6 named checks: required tags present, data type validation,
  cross-reference consistency, calculation linkbase, presentation linkbase, label completeness) —
  each with `passed`/`failed`/`total` out of 202.
- **`MAPPED_STATUS`** (Fully/Partially/Not Mapped pie: 155/32/15, summing to 202 — consistent with
  `VALIDATION_RESULTS`' 202 total, suggesting the two datasets were at least authored to agree with
  each other even though neither is derived from a live tagging process).
- **`TAG_SAMPLES`** (8 example ISSB S2/ESRS E1 tag names with plausible XBRL element-name syntax,
  e.g. `ifrs-s2:AbsoluteGrossScope1`, `esrs-e1:EnergyConsumptionTotal`) — real-looking taxonomy
  concept naming conventions, though not verified against the actual published IFRS/EFRAG taxonomy
  files.

Only two live computations exist: `totalS2 = Σ S2_CATEGORIES.tags` (202... wait, sums to 28+42+35+65+32=202)
and `totalE1 = Σ E1_CATEGORIES.tags` (18+22+15+20+35+12=122), both displayed in the page subtitle.

### 7.2 Parameterisation

| Table | Total tags | Mapped | Validated | Coverage |
|---|---|---|---|---|
| ISSB S2 (5 categories) | 202 | 157 | 134 | 77.7% mapped, 66.3% validated |
| ESRS E1 (6 categories) | 122 | 101 | 86 | 82.8% mapped, 70.5% validated |

The guide's cited "ISSB S2: 200+ tags" and "ESRS E1: 80+ tags" are consistent with these totals
(202 and 122 respectively both exceed the guide's rounded figures), suggesting the constants were
chosen to match the guide's cited external counts even though no live IFRS/EFRAG taxonomy file is
parsed.

### 7.3 Calculation walkthrough

1. **Taxonomy Browser tab** — likely renders `S2_CATEGORIES`/`E1_CATEGORIES` directly as
   bar/table views.
2. **Tag Mapping Tool tab** — `filteredTags` searches `TAG_SAMPLES` (8 rows only) by tag name or
   element name substring — a real search/filter mechanic, but over a tiny illustrative sample, not
   the full 202+122 tag universe the summary cards claim to cover.
3. **Validation Engine tab** — renders `VALIDATION_RESULTS` (6 static checks) — no actual XBRL
   document is validated; the pass/fail counts are fixed regardless of any user action.
4. **Filing Preview tab** — presumably renders a mock iXBRL preview from static content, not a
   generated document from real underlying ESG data.

### 7.4 Data provenance & limitations

- **Every count in this module is a static, hand-authored constant.** There is no live semantic-
  matching engine, no actual EFRAG/IFRA taxonomy file parsing, and no per-user tagging session state
  — every visitor to this page sees identical, unchanging mapping/validation figures.
- **`TAG_SAMPLES` (8 rows) is far smaller than the 202+122 tags the summary KPIs claim** — the Tag
  Mapping Tool cannot actually demonstrate mapping for the vast majority of tags it claims exist.
- The sibling module `xbrl-export-wizard` has a genuinely functional backend engine
  (`backend/services/xbrl_export_engine.py`) with a real ESRS-to-XBRL taxonomy dictionary and ESEF
  validation rules (LEI format check, period-date ordering, taxonomy-membership check, duplicate-fact
  detection) — that engine's `ESRS_XBRL_TAXONOMY` dictionary would be a natural, already-built source
  to replace this module's static `E1_CATEGORIES`/`TAG_SAMPLES` with real taxonomy data (see that
  module's deep dive for detail on why it's also not currently wired to any frontend).

**Framework alignment:** ISSB XBRL Taxonomy and ESRS ESEF Taxonomy (both named in the guide) are
represented only as illustrative summary counts and 8 example tag names — no live taxonomy file is
loaded or validated against in this module.

## 9 · Future Evolution

### 9.1 Evolution A — Real taxonomy data and a working mapping session (analytics ladder: rung 1 → 2)

**What.** Every count on this page is a hand-authored constant: §7.4 documents that
there is no semantic-matching engine, no taxonomy file parsing, and no per-user
tagging state — the Validation Engine's pass/fail counts never change, and the Tag
Mapping Tool searches only 8 sample rows while the KPIs claim 202 ISSB S2 + 122 ESRS
E1 tags. §7.4 also names the fix: the sibling `xbrl-export-wizard` already has a
functional backend engine (`xbrl_export_engine.py`) with a real `ESRS_XBRL_TAXONOMY`
dictionary and genuine ESEF validation rules (LEI format, period ordering,
taxonomy-membership, duplicate-fact detection). Evolution A wires this module to that
engine rather than building a second one: a `GET /api/v1/xbrl/taxonomy` route serving
the full tag dictionary (extended with the ISSB S2 concept list from the published
IFRS taxonomy file), a persisted `xbrl_tag_mappings` table so a user's
platform-metric → tag mappings survive reload, and mapping/validation counts computed
from that table instead of asserted.

**How.** Backend additions live in the sibling's route file (shared engine, per the
platform's edits-propagate convention); the Taxonomy Browser paginates the real
dictionary; `MAPPED_STATUS` and `VALIDATION_RESULTS` become live aggregations of the
session's mappings run through the engine's validators.

**Prerequisites.** The static-counts illusion acknowledged; ISSB S2 taxonomy concepts
sourced from the actual IFRS Foundation file (the current 8 `TAG_SAMPLES` are
plausible-looking but unverified per §7.1). **Acceptance:** mapping a metric changes
the coverage pie; the browser lists hundreds of real tags, searchable; validation
failures cite the specific engine rule that fired.

### 9.2 Evolution B — Semantic tag-mapping copilot (LLM tier 2)

**What.** The guide's own methodology line — "Match = PlatformMetric → XBRL_Tag using
semantic matching" — is inherently an LLM task, and this module is one of the
platform's most natural tier-2 fits. The copilot takes a platform metric (name, unit,
definition — e.g. "Scope 1 gross emissions, tCO2e, market-based excluded") and
proposes the correct tag (`ifrs-s2:AbsoluteGrossScope1`) with a confidence rationale,
by retrieving candidates from the Evolution A taxonomy endpoint and reasoning over
their official definitions — never inventing tag names. Accepted mappings are written
via the mappings endpoint after user confirmation; rejected proposals are logged to
`llm_traces` as training signal. Bulk mode maps a whole disclosure dataset and routes
low-confidence matches to a human review queue.

**How.** Tier-2 stack: `GET /taxonomy` (candidate retrieval, embedding-based over
pgvector — the tag definitions are the corpus) plus the confirm-gated mapping write;
the validator checks every proposed tag string exists verbatim in the taxonomy
dictionary, which makes fabrication structurally impossible here — an invented tag
simply fails the existence check.

**Prerequisites (hard).** Evolution A's real taxonomy endpoint (semantic matching
over 8 sample rows would be theatre); tag-definition embeddings in
`llm_corpus_chunks`. **Acceptance:** every proposed tag exists in the dictionary; a
metric with no reasonable tag yields "no match" with the nearest candidates listed,
not a forced mapping; bulk-mode accuracy measured against a hand-mapped fixture set
before default-on.