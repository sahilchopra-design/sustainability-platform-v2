# Sanctions Watchlist
**Module ID:** `sanctions-watchlist` · **Route:** `/sanctions-watchlist` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG-focused sanctions watchlist management tracking sanctioned entities with ESG controversy flags, enabling dual compliance and sustainability screening.

> **Business value:** Combines sanctions compliance with ESG controversy screening to flag entities of dual regulatory and reputational concern.

**How an analyst works this module:**
- Ingest daily updates from OFAC, UN, EU and supplementary ESG controversy data providers.
- Deduplicate and fuzzy-match entity names across lists using LEI and ISIN cross-reference.
- Score each entity on combined sanctions severity and ESG controversy dimensions.
- Deliver portfolio-specific alerts and generate periodic watchlist summary reports.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENTITY_TYPES`, `LISTS`, `MONTHLY_ADDS`, `NATIONALITIES`, `PROG_TYPES`, `RISK_COLOR`, `SCREENING_HITS`, `SDN_ENTRIES`, `STATUS_COLOR`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `LISTS` | 11 | `authority`, `entries`, `lastUpdate`, `type`, `coverage`, `critical` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `riskScore` | `70 + Math.floor(sr(i * 3) * 30);` |
| `matchTypes` | `['Exact Name','Fuzzy Name (87%)','Alias Match','LEI Cross-ref','ISIN Cross-ref'];` |
| `actions` | `['Block Transaction','Enhanced DD Required','Flag for Review','Auto-cleared','Escalate to Compliance'];` |
| `progBreakdown` | `useMemo(() => PROG_TYPES.map(p => ({` |
| `natBreakdown` | `useMemo(() => NATIONALITIES.map(n => ({` |
| `totalCriticalEntries` | `criticalLists.reduce((s,l)=>s+l.entries,0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/sanctions/status` | `status` | api/v1/routes/sanctions_screening.py |
| POST | `/api/v1/sanctions/screen` | `screen` | api/v1/routes/sanctions_screening.py |
| GET | `/api/v1/sanctions/uflpa-list` | `uflpa_list` | api/v1/routes/sanctions_screening.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `XUAR` *(shared)*, `__future__` *(shared)*, `datetime` *(shared)*, `dhs` *(shared)*, `fastapi` *(shared)*, `pathlib` *(shared)*, `persons` *(shared)*, `pydantic` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ENTITY_TYPES`, `LISTS`, `NATIONALITIES`, `NAT_COLORS`, `PROG_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Watchlist Entities | — | Consolidated lists | Total entities on active watchlist combining sanctions, PEP and ESG controversy flags. |
| High Severity Flags | — | RepRisk/MSCI | Entities with both active sanctions exposure and high-severity ESG controversies. |
| Daily Alert Rate | — | Live feed | Average new watchlist additions per business day across all source lists. |
- **Sanctions lists, ESG controversy feeds, portfolio entity register** → Fuzzy matching, LEI resolution, dual-dimension scoring → **Watchlist alerts, portfolio exposure reports, escalation logs**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Controversy Overlap Score
**Headline formula:** `Sanctioned Entity ESG Controversy Count ÷ Max Controversy Count × 100`

Normalised score combining sanctions status with ESG controversy severity for each flagged entity.

**Standards:** ['RepRisk', 'MSCI ESG', 'OFAC SDN']
**Reference documents:** OFAC SDN List; UN Consolidated Sanctions List; EU Financial Sanctions Files; RepRisk Global Watch List; MSCI ESG Controversy Scores

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **7** other module(s).

| Connected module | Shared via |
|---|---|
| `sanctions-climate-finance` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `platform-analytics` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `sanctions-trade-monitor` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `sanctions-screening-desk` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `energy-transition-credit-portal` | table:pathlib |
| `module-navigator` | table:pathlib |
| `infra-debt-portfolio-manager` | table:pathlib |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states `ESG Controversy Overlap
> Score = Sanctioned Entity ESG Controversy Count / Max Controversy Count x 100`, describing a
> dual-dimension score combining sanctions status with RepRisk/MSCI ESG controversy severity.
> **No ESG or controversy data exists anywhere in this module.** There is no RepRisk field, no
> MSCI ESG controversy field, and no combined score. The module is a pure **sanctions-list watch
> tool** — `riskScore` is a seeded PRNG value (`70 + sr(i×3)×30`, i.e. always 70-100) representing
> generic "model risk," with no ESG dimension whatsoever.

### 7.1 What the module computes

```
riskScore = 70 + floor(sr(i x 3) x 30)          // 70-99, per SDN-style watchlist entry
avgRiskScore = Sum(riskScore) / n
progBreakdown[p] = count of entries where prog === p        // per PROG_TYPES
natBreakdown[n]  = count of entries where nat === n          // per NATIONALITIES
totalCriticalEntries = Sum(LISTS[i].entries) where LISTS[i].critical === true
```

### 7.2 Parameterisation

| Field | Range/Content | Provenance |
|---|---|---|
| `PROG_TYPES` | SDN, BLOCKED, EO13662, EO14024, IRAN, RUSSIA, DPRK, CUBA, VENEZUELA, CYBER | Real OFAC sanctions-program designations, correctly named |
| `NATIONALITIES` | RU, IR, CN, KP, VE, SY, CU, BY, MM, AF | Real ISO country codes for commonly-sanctioned jurisdictions |
| `riskScore` | `70 + floor(sr(i×3)×30)` → 70-99 | Synthetic demo, artificially compressed into a narrow high-risk band (nothing on this list ever scores below 70) — appropriate for a "confirmed match" list but the guide's implication of a graduated 0-100 scale combining two independent risk dimensions is not what this produces |
| `matchTypes` | Exact Name, Fuzzy Name (87%), Alias Match, LEI Cross-ref, ISIN Cross-ref | Realistic entity-resolution match-type taxonomy, assigned round-robin (`i % 5`), not from an actual fuzzy-matching algorithm |
| `actions` | Block Transaction, Enhanced DD Required, Flag for Review, Auto-cleared, Escalate to Compliance | Realistic compliance-workflow action taxonomy, assigned round-robin, not derived from `riskScore` or `matchType` |
| `LISTS` (11 rows) | authority, entries, lastUpdate, type, coverage, critical flag | Static reference table of real sanctions-list sources (OFAC, UN, EU, etc.) with plausible entry counts |

### 7.3 Calculation walkthrough

1. `SDN_ENTRIES` (N synthetic rows) cycle through `PROG_TYPES`/`NATIONALITIES`/`matchTypes`/
   `actions` via modulo indexing (`i % 10`, `i % 5`) rather than independent random sampling —
   so the sequence of programs/nationalities/match-types/actions is deterministic and repeating,
   not representative of a real list's distribution.
2. `avgRiskScore` is a straight mean over all entries; because every entry is seeded into the
   70-99 band, this average will always land near 84-85 regardless of the actual underlying watch
   list composition.
3. `progBreakdown`/`natBreakdown` are simple `filter().length` counts per category — genuine
   aggregations, but over the synthetic, round-robin-generated entry set.
4. `totalCriticalEntries` sums the static `LISTS.entries` field for lists flagged `critical: true`
   — the one aggregation drawing from genuinely static (not randomly generated) reference data.

### 7.4 Data provenance & limitations

- No ESG or controversy dimension exists in the code despite being the module's namesake
  methodology in the guide — this module cannot answer "which sanctioned entities also have severe
  ESG controversies," which is its stated purpose.
- `riskScore`'s narrow 70-99 range means the "risk score" cannot meaningfully discriminate between
  entries — every match looks equally severe.
- Match-type and compliance-action assignment via modulo cycling (not tied to `riskScore` or actual
  fuzzy-match confidence) means the displayed "Fuzzy Name (87%)" or "Block Transaction" labels
  don't reflect any real entity-resolution or risk-based decisioning logic.
- `LISTS` entry counts and `PROG_TYPES`/`NATIONALITIES` taxonomies are the module's most credible
  content — real regulatory program/jurisdiction names, correctly reproduced.

**Framework alignment:** OFAC SDN List, UN Consolidated Sanctions List, EU Financial Sanctions
Files (list sources named correctly, not live-synced) · RepRisk Global Watch List and MSCI ESG
Controversy Scores (named in the guide as the ESG-dimension data source; **entirely absent** from
the implementation) · LEI/ISIN cross-referencing (named as a match-type category, not implemented
as an actual resolution algorithm).

## 9 · Future Evolution

### 9.1 Evolution A — Build the ESG-overlap dimension the module is named for (analytics ladder: rung 1 → 2)

**What.** §7's flag is definitional: the module's namesake methodology — an ESG Controversy Overlap Score combining sanctions status with controversy severity — has no implementation; no ESG or controversy field exists anywhere, `riskScore` is a seeded 70–99 draw too narrow to discriminate between entries, and match-type/compliance-action labels ("Fuzzy Name (87%)", "Block Transaction") are modulo-cycled decorations unrelated to any real matching logic. Evolution A makes the watchlist real and adds the dual-screening dimension honestly scoped to data the platform can hold.

**How.** (1) Watchlist entries become persisted org-scoped records whose sanctions status and match confidence come from `sanctions-screening-desk`'s live CSL/UFLPA screening — the modulo-cycled labels deleted, real match scores rendered. (2) The ESG dimension built from available signals rather than a licensed controversy feed the platform lacks: the platform's own enforcement-action records (per `regulatory-enforcement-monitor`'s evolution), disclosure-derived scores, and UFLPA forced-labor designations (already an ESG-relevant list) — with the overlap score defined over these named components and its coverage limits documented; if RepRisk/MSCI feeds arrive later, they slot into the same component structure. (3) `riskScore` re-derived as match confidence × severity components across the full 0–100 range, with the formula published. (4) Watch alerts: re-screening on list updates flags status changes per entry.

**Prerequisites.** Screening-desk integration; enforcement-record availability (sibling evolution dependency); honest relabeling if the controversy component stays thin. **Acceptance:** every match label reflects an actual screening response; the overlap score decomposes into its named components; two entries with different match evidence get discriminably different scores.

### 9.2 Evolution B — Watchlist-review copilot (LLM tier 2)

**What.** Watchlists rot without review. The copilot runs the review cycle: "which entries changed status since the last list update, and which have new enforcement actions?", "summarize the evidence file for this entry — sanctions designations, enforcement history, match confidence — for the quarterly compliance review", composing per-entry dossiers from screening results and linked records.

**How.** Tier-2 tool calls over the watchlist, screening, and (where integrated) enforcement-record endpoints; dossiers quote list entries and enforcement records verbatim with source URLs/dates. Change detection uses ingested list version diffs. The dual-dimension framing is presented with its documented coverage limits — the copilot states which ESG components were checked and which were unavailable, mirroring the module's honest-scoping requirement rather than implying full controversy coverage. Non-determination discipline inherited from the screening desk; review outcomes (retain/escalate/remove) are human decisions the copilot records but never makes.

**Prerequisites (hard).** Evolution A — dossiers built on modulo-cycled labels and a 70–99 random score would be fabricated compliance evidence; version-diff and linkage plumbing. **Acceptance:** every dossier item resolves to a stored record with source; change lists reproduce from diffs; component-coverage statements match what was actually queried.