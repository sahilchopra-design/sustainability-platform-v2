# Assessment Audit Trail
**Module ID:** `assessment-audit-trail-v2` · **Route:** `/assessment-audit-trail-v2` · **Tier:** B (frontend-computed) · **EP code:** EP-CW5 · **Sprint:** CW

## 1 · Overview
Score change log, version history, drift monitoring, data lineage, and ISAE 3000 compliance evidence pack.

**How an analyst works this module:**
- Change Log shows timestamped score changes
- Score Drift Monitor flags entities with significant changes
- Data Lineage traces scores to source

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CHANGE_LOG`, `Card`, `DRIFT_DATA`, `ENTITIES_LIST`, `KPI`, `LINEAGE`, `TABS`, `USERS`, `USER_ACTIVITY`, `VERSIONS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `LINEAGE` | 6 | `node`, `source` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `DRIFT_DATA` | `ENTITIES_LIST.map((e,i) => ({` |
| `USER_ACTIVITY` | `USERS.map((u,i) => ({` |
| `delta` | `c.newValue - c.oldValue;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITIES_LIST`, `LINEAGE`, `TABS`, `USERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Change Log Entries | — | Audit system | Timestamped score changes |
| Drift Threshold | — | Configurable | 3-month score change alert |

## 5 · Intermediate Transformation Logic
**Methodology:** Score lineage tracking
**Headline formula:** `Every score traced: Entity → TaxonomyNode → DataSource → RawDatapoint`

Score drift: entities with >5 point drift over 3 months flagged. Data lineage: trace any score back to its source data point. ISAE 3000 compliance evidence pack for assurance readiness.

**Standards:** ['ISAE 3000', 'ISAE 3410']
**Reference documents:** ISAE 3000 (Revised); ISAE 3410

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The footer text and guide claim the audit trail enforces
> **"immutable once committed, with cryptographic hash chains for tamper evidence"** and that score
> drift uses **"Bollinger Band-style thresholds with 2-sigma confidence intervals on rolling 90-day
> windows."** **None of that exists in the code.** All records are ephemeral React module constants
> regenerated on every mount from a seeded PRNG (no persistence, no hashing, no immutability); the
> "drift" is a single random number per entity, and the alert is a flat `|drift| > 5` threshold — no
> standard deviation, no rolling window, no Bollinger band. The compliance-evidence "pack" is a set of
> static status cards with a decorative "Generate Audit Pack" button that flips a boolean. The sections
> below document the code as it behaves.

### 7.1 What the module computes

`frontend/src/features/assessment-audit-trail-v2/pages/AssessmentAuditTrailV2Page.jsx` (EP-CW5, Sprint CW) presents six tabs over five synthetic datasets: Change Log (30 rows), Version History (8), Score Drift Monitor (8 entities), User Activity (5 assessors), Data Lineage (5-node chain), Compliance Evidence (6 static cards). The only per-row *computation* is:

```
delta = newValue − oldValue                         // change-log delta column, coloured by sign
alert = |drift| > 5                                 // drift-alert boolean (flat threshold)
```

Header KPIs are trivial counts: `CHANGE_LOG.length` (30), `VERSIONS.length` (8), `DRIFT_DATA.filter(alert).length`.

### 7.2 Parameterisation — seeded generators

Every dataset is built from the platform PRNG `sr(s) = frac(sin(s+1)×10⁴)`, keyed off the row index:

| Dataset | Field | Generator |
|---|---|---|
| CHANGE_LOG (30) | oldValue | `round(50 + (sr(i×10)×2 − 1)×15)` → ~35–65 |
| | newValue | `round(52 + (sr(i×10)×2−1)×15 + (sr(i×510)×2−1)×3)` |
| VERSIONS (8) | totalScore | `round(65 − i×1.5 + (sr(i×10)×2−1)×5)` (declining with version age) |
| DRIFT_DATA (8) | drift | `round(3 + (sr(i×510)×2−1)×5)` → ~ −2…+8 |
| | alert | `|3 + (sr(i×510)×2−1)×5| > 5` |
| USER_ACTIVITY (5) | assessments | `round(12 + (sr(i×10)×2−1)×8)`; qualityScore `88 − i×3` |

The `(sr(...)×2 − 1)` transform recentres the [0,1) PRNG to [−1,1) so it acts as a signed noise term around a base. Note `DRIFT_DATA.q1/q2/q3` all use the *same* seed `sr(i×10)` with only the base shifted (60/61/63), so the three "quarters" move in lockstep — a synthetic artefact, not independent quarterly readings.

Static (non-PRNG) tables: `LINEAGE` — a hand-built 5-level provenance chain (Score → L2 → L3 → Data Point → Raw Source), e.g. "Environmental: 72" → "Emissions Mgmt: 68 (weighted avg of 4 L3)" → "Scope 1 Reduction: 74 (CDP Climate 2025)" → "Scope 1: 1.2M tCO₂e −8% YoY (Annual Report p.47)" → "GHG Protocol, ISAE 3410 assured". This is the module's most substantive content and is fixed illustrative data.

### 7.3 Calculation walkthrough

Change-log tab: entity filter chips → `filteredLog` → per-row `delta = newValue − oldValue`, coloured green/red/grey. Drift tab: bar chart of `drift` per entity with ±5 reference lines; bars coloured red if `alert` else green; alert cards list entities with `|drift| > 5`. User-activity tab: table with quality-score thresholds (≥85 green, ≥75 amber, else red). Lineage tab: renders the 5-node chain as a vertical timeline. No aggregation crosses datasets.

### 7.4 Worked example — a change-log row and a drift alert

Change-log row i=3: oldValue = round(50 + (sr(30)×2−1)×15), newValue = round(52 + same-seed noise + (sr(1530)×2−1)×3). Suppose old = 58, new = 63 → **delta = +5**, rendered green with a "+" prefix, tagged reason "Peer benchmark adjustment" (`['Quarterly…','New disclosure','Methodology update','Peer benchmark','Regulatory update'][3%5]`).

Drift entity i where `sr(i×510) = 0.9` → drift = round(3 + (0.9×2−1)×5) = round(3 + 4) = 7 → `|7| > 5` → **alert true**, bar red, and an alert card reads "Drift: +7 pts in 3 months". The KPI "Drift Alerts" counts all such entities.

### 7.5 Data provenance & limitations

- **Every change-log entry, version, drift value, and user stat is synthetic**, generated by the seeded PRNG `sr(seed)=frac(sin(seed+1)×10⁴)` off row indices — reproducible per session but regenerated fresh on each mount and **not persisted anywhere** (no localStorage, no backend). There is no real audit trail.
- The footer's claims of immutability, cryptographic hash chains, and 2-sigma Bollinger-band drift detection are **aspirational copy with no implementing code** — the actual drift test is a flat `|x| > 5` on a single random draw, and q1/q2/q3 share a seed.
- The "Compliance Evidence Pack (ISAE 3000)" is six static status badges (`Ready`/`Generating`); the "Generate Audit Pack" button only sets a boolean that reveals a "ready for download" label — no file is produced.
- Timestamps are string-formatted with brittle arithmetic (`2026-0${3-floor(i/15)}-…`), fine for display but not real event times.

### 7.6 Framework alignment

- **ISAE 3000 (Revised)** — the module *represents* what an ISAE 3000 evidence pack would contain (timestamped change log with user attribution, version diffs, score-to-source lineage, RBAC access log, methodology docs, inter-rater QA). The LINEAGE chain correctly models the assurance principle that every reported score must be traceable to a dated, assured raw source — but the implementation is a mock-up, not an assurance-grade immutable ledger.
- **ISAE 3410** — cited in the lineage's raw-source node ("GHG Protocol… ISAE 3410 assured"), the IAASB standard for GHG-statement assurance; used here as provenance metadata on the emissions data point.
- **GHG Protocol Corporate Standard** — named as the root source for the Scope 1 emissions figure feeding the environmental score, correctly positioning the accounting standard at the base of the lineage.
- Score-drift monitoring gestures at statistical process control (control-limit alerting) but does not implement any named method (the "Bollinger Band / 2-sigma" claim is unbacked); a production version would compute rolling mean ± k·σ over an actual time series.

## 9 · Future Evolution

### 9.1 Evolution A — Real event-sourced audit trail with statistical drift detection (analytics ladder: rung 1 → 3)

**What.** The page's own footer claims immutability, cryptographic hash chains, and 2-sigma Bollinger-band drift detection — §7's mismatch flag documents that **none of it exists**: all records are PRNG-regenerated React constants (`sr(seed)=frac(sin(seed+1)×10⁴)`), nothing persists, drift is a single random draw against a flat `|x| > 5` threshold, and q1/q2/q3 share a seed so "quarters" move in lockstep. Evolution A builds the real thing: a persisted, append-only score-change ledger with the statistical drift monitor the copy promises.

**How.** (1) Table `assessment_score_events` (entity, node, old_value, new_value, reason, user_id, ts, prior_hash, row_hash) written by the actual scoring engines whenever a score changes — the platform's `AuditMiddleware` pattern is the precedent; hash chaining makes the tamper-evidence claim true. (2) Drift monitor computed from the event history: rolling 90-day mean ± 2σ per entity (the exact method the footer advertises), replacing the flat threshold — this is honest rung-3 territory because control limits are calibrated to each entity's observed variance. (3) The hand-built 5-node `LINEAGE` chain (the module's best content) generalises: lineage assembled from the event's node path in `TAXONOMY_TREE` plus the source metadata already carried in `REFERENCE_DATA_SOURCES`. (4) "Generate Audit Pack" produces an actual export (event slice + hash-chain verification result), not a boolean flip.

**Prerequisites.** Scoring engines must emit change events (instrumentation work outside this module); Alembic migration; delete the PRNG generators — synthetic entries must never share a table with real evidence. **Acceptance:** mutating a historical row breaks chain verification; an entity with stable scores and one with volatile scores get different control limits; the audit pack downloads and re-verifies.

### 9.2 Evolution B — Assurance-evidence copilot (LLM tier 2)

**What.** Once real events exist, this module is the natural surface for assurance-preparation Q&A: "show me every change to Entity X's environmental score this quarter and who made them", "which entities breached their drift limits and was any breach methodology-driven?", "assemble the ISAE 3000 evidence bundle for the FY25 assessment" — each answered by tool calls against the event ledger and lineage endpoints, drafted in the evidence-pack structure §7.6 describes (attributed change log, version diffs, score-to-source lineage).

**How.** Read-only tool schemas over the Evolution-A API (event query, drift status, lineage resolve, chain-verify); grounding corpus is this Atlas record plus ISAE 3000/3410 alignment notes in §7.6. The chain-verify tool is what makes the copilot assurance-credible: every evidence bundle it drafts embeds the verification result, so the LLM asserts integrity by citing a computed check, never by claiming it. Mutations are out of scope entirely — an audit trail an LLM can write to is not an audit trail.

**Prerequisites (hard).** Evolution A end-to-end; a copilot narrating the current seeded-random change log would fabricate an audit history, the worst possible failure mode for a compliance module. **Acceptance:** every event, user, and delta in a copilot answer resolves to a ledger row; asked about a period with no events, it says so; evidence bundles include a passing chain-verification stamp.