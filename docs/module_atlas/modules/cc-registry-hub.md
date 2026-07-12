# Carbon Registry Hub
**Module ID:** `cc-registry-hub` · **Route:** `/cc-registry-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Unified interface for carbon credit registry operations across Verra VCS, Gold Standard, Climate Action Reserve, ACR, and CDM. Provides account management, serial number tracking, cross-registry deduplication, and CORSIA eligibility screening.

> **Business value:** Registry Hub provides single-pane view of credits across 5 registries. CORSIA eligibility requires vintage ≥2016 and approved programme. Cross-registry deduplication prevents double-counting.

**How an analyst works this module:**
- Registry Accounts tab shows live balances across 5 registries
- Serial Tracker tab searches and tracks individual credit serials
- CORSIA Screening tab filters eligible credits for aviation use
- Deduplication tab runs cross-registry serial check
- Transfer Queue tab manages pending registry instructions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API_STATUS`, `Badge`, `ERROR_LOG`, `GS_WORKFLOW`, `Kpi`, `METHODOLOGIES`, `PROJECTS`, `PURO_WORKFLOW`, `REGISTRIES`, `REGISTRY_DETAILS`, `Section`, `TabBar`, `VERRA_WORKFLOW`, `WorkflowTable`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGISTRIES` | 7 | `name`, `short`, `color`, `url` |
| `VERRA_WORKFLOW` | 8 | `name`, `duration`, `status` |
| `GS_WORKFLOW` | 7 | `name`, `duration`, `status` |
| `PURO_WORKFLOW` | 6 | `name`, `duration`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d = 1) => { if (n == null \|\| !isFinite(n)) return '—'; return n >= 1e9 ? `${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(d)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(d)}K` : `${n.toFixed(d)}`; };` |
| `REGISTRY_DETAILS` | `REGISTRIES.map((r, i) => ({` |
| `API_STATUS` | `REGISTRIES.map((r, i) => ({` |
| `TABS` | `['Registry Overview', 'Verra VCS Panel', 'Gold Standard Panel', 'Puro & Isometric Panel', 'Cross-Registry Analytics', 'API Health & Sync'];` |
| `totalIssued` | `useMemo(() => REGISTRY_DETAILS.reduce((a, r) => a + r.issued_total, 0), []);` |
| `totalRetired` | `useMemo(() => REGISTRY_DETAILS.reduce((a, r) => a + r.retired_total, 0), []);` |
| `totalProjects` | `useMemo(() => REGISTRY_DETAILS.reduce((a, r) => a + r.active_projects, 0), []);` |
| `portfolioByRegistry` | `useMemo(() => REGISTRY_DETAILS.map(r => ({` |
| `methodologyCoverage` | `useMemo(() => METHODOLOGIES.slice(0, 8).map((m, i) => ({` |
| `feeComparison` | `useMemo(() => REGISTRY_DETAILS.map(r => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GS_WORKFLOW`, `METHODOLOGIES`, `PURO_WORKFLOW`, `REGISTRIES`, `TABS`, `VERRA_WORKFLOW`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Account Balance | `Registry API query` | Registry system | Current available credits in each registry account by project and vintage |
| CORSIA Eligible % | `Eligible credits / total × 100` | ICAO CORSIA list | Share of portfolio meeting CORSIA aviation offset criteria |
| Cross-Registry Duplicates | `Serial intersection across registries` | Deduplication engine | Credits appearing in more than one registry (should be zero) |
| Pending Retirements | `Reserved but not yet retired` | Registry queue | Volume in reservation status awaiting retirement instruction |
- **Registry APIs** → Account positions → unified balance → **Cross-registry portfolio view**
- **CORSIA approved list** → Programme eligibility → CORSIA flag → **Aviation-eligible credit volume**

## 5 · Intermediate Transformation Logic
**Methodology:** Cross-registry serial deduplication and CORSIA eligibility matrix
**Headline formula:** `DuplicateFlag = serial_i ∈ RegistrySet_j (j ≠ registry_i); CORSIAEligible = vintage ≥ 2016 AND standard ∈ CORSIAApprovedList`

Serial number deduplication checks each credit serial against a unified cross-registry ledger to detect double-issuance or double-retirement. CORSIA eligibility requires vintage year ≥ 2016, approved programme, and meeting CORSIA Sustainability Criteria. Registry API integrations pull live account balances; status updates propagated to CarbonCreditContext.

**Standards:** ['ICAO CORSIA Eligible Fuels & Credits', 'Verra Registry Procedures', 'Gold Standard Registry Rules', 'CDM Registry Manual']
**Reference documents:** ICAO CORSIA Eligible Credits Program 2024; Verra VCS Registry Procedures v4.4; Gold Standard Registry User Guide v3; Climate Action Reserve Registry Manual

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry describes a cross-registry operations hub with **serial-number deduplication**
and **CORSIA eligibility screening**. The code is largely a **dashboard/aggregation** module: it sums
issued/retired volumes across registries, plots fee and methodology-coverage comparisons, and shows a
synthetic API-health panel. The guide's deduplication formula
(`DuplicateFlag = serial_i ∈ RegistrySet_j`) and CORSIA matrix are **not implemented** as computed
logic — there is no serial ledger in code. It does import one real dataset (`verraRegistryData`).

### 7.1 What the module computes

No emission calculations. Headline aggregates over the `REGISTRY_DETAILS` table:
```
totalIssued  = Σ registry.issued_total
totalRetired = Σ registry.retired_total
totalProjects= Σ registry.active_projects
```
Plus derived views: `portfolioByRegistry` (issued/retired per registry), `methodologyCoverage`
(first 8 methodologies × registry presence), `feeComparison` (registration/issuance/retirement fees).

### 7.2 Parameterisation / data rubric

| Data element | Source | Provenance |
|---|---|---|
| `VERRA_PROJECTS`, `VERRA_STATS` | imported | Real Verra registry data (`data/verraRegistryData`) |
| Verra issued/retired anchors | `1,820e6 / 910e6`, projects 2,140 | Hard-coded overrides (row 0) — realistic Verra scale |
| Gold Standard anchors | `260e6 / 148e6`, projects 320 | Hard-coded overrides (row 1) |
| ACR/Puro/Iso/CAR volumes, all fees, timelines, buffer % | `sr()`-seeded | **Synthetic** PRNG demo data |
| API status, latency, uptime, sync times | `sr()`-seeded | **Synthetic** — no live registry API is called |
| 15 `PROJECTS` (issued/retired/vintage) | `sr()`-seeded | **Synthetic** except project names |

### 7.3 Calculation walkthrough

`REGISTRY_DETAILS` is built by mapping the 6 registries through `sr()`-seeded fields, then overriding
rows 0–1 (Verra, Gold Standard) with realistic hard-coded totals. The KPIs reduce this table; the
charts re-slice it by registry, methodology, and fee. The API-health tab is a static synthetic status
board (`status: sr(i·7)>0.15 ? 'Connected' : 'Degraded'`). There is no user-input calculation path.

### 7.4 Worked example (portfolio aggregation)

With Verra overridden to 1,820M issued / 910M retired and Gold Standard to 260M / 148M, and the four
`sr()`-seeded registries adding (illustratively) ~2,000M issued / ~1,200M retired, `totalIssued`
≈ 4.1B tCO₂e and `totalRetired` ≈ 2.3B — a retirement ratio ≈ 56%. These aggregate correctly from the
table but only the two anchored rows reflect real registry scale; the remainder are synthetic.

### 7.5 Data provenance & limitations
- **Mostly synthetic seeded demo data** (`sr()`), with Verra/GS totals hard-coded to realistic
  values and a genuine `verraRegistryData` import.
- No serial-number ledger, so the guide's cross-registry deduplication cannot run; the "Deduplication"
  and "CORSIA Screening" tabs are presentational.
- API-health metrics are simulated — no live registry integration exists.

**Framework alignment:** **ICAO CORSIA** eligibility (vintage ≥ 2016 + approved programme + CORSIA
Sustainability Criteria) is described but not computed. **Verra VCS / Gold Standard / CAR / ACR
registry procedures** define the serialisation and retirement semantics the hub is meant to
consolidate; production deduplication would hash each credit's registry-scoped serial and detect
cross-registry collisions.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module presents a "cross-registry
duplicate count" and "CORSIA eligible %" without a computing engine.

**8.1 Purpose & scope.** Detect double-issuance/double-retirement across registries and screen a
credit portfolio for CORSIA aviation eligibility. Coverage: all credits held or tracked across the 6
registries.

**8.2 Conceptual approach.** A canonical **unified serial ledger** with deterministic collision
detection (the approach used by the Climate Warehouse / CAD Trust distributed metadata ledger) plus a
rules-based CORSIA eligibility filter mirroring ICAO's Technical Advisory Body (TAB) approved-programme
list.

**8.3 Mathematical / logical specification.**
```
Canonical key: k = hash(registry_scheme || project_id || vintage || serial_block_start..end)
DuplicateFlag(c) = |{ c' ≠ c : ranges_overlap(c, c') and same_underlying_project(c,c') }| > 0
CORSIAEligible(c) = (vintage ≥ 2016) ∧ (c.programme ∈ TAB_approved)
                    ∧ (c.unit_type ∈ eligible_types) ∧ has_corresponding_adjustment(c)
CORSIA_eligible_pct = Σ_c CORSIAEligible(c)·qty_c / Σ_c qty_c · 100
```
| Parameter | Value | Source |
|---|---|---|
| TAB_approved list | dynamic | ICAO CORSIA Eligible Emissions Units list |
| Vintage floor | 2016 | ICAO CORSIA pilot-phase rule |
| Corresponding-adjustment flag | per credit | UNFCCC Article 6.2 host-country authorisation registry |

**8.4 Data requirements.** Per credit: registry, project id, vintage, serial range, programme,
unit type, retirement status, corresponding-adjustment status. Sources: registry APIs (Verra/GS/CAR/
ACR public retirement DBs), CAD Trust, ICAO TAB list. Platform holds `verraRegistryData` already.

**8.5 Validation & benchmarking plan.** Reconcile aggregate issued/retired against each registry's
published totals (Verra/GS public dashboards). Seed known duplicate serials to confirm detection;
confirm CORSIA counts against ICAO's published eligible-unit volumes.

**8.6 Limitations & model risk.** Serial-format heterogeneity across registries makes canonical-key
construction error-prone; missing corresponding-adjustment metadata biases CORSIA eligibility high.
Conservative fallback: treat unknown-adjustment credits as ineligible and flag unresolved serial
formats for manual review.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the serial ledger and CORSIA screen the guide advertises (analytics ladder: rung 1 → 2)

**What.** §7 is blunt: the guide's deduplication formula
(`DuplicateFlag = serial_i ∈ RegistrySet_j`) and CORSIA eligibility matrix are **not
implemented** — the page is registry-volume rollups, fee comparisons, and a synthetic
API-health panel, with one genuinely real import (`verraRegistryData`). Evolution A
builds the missing logic on the platform's real Verra foundation: the seeded Verra
registry projects (migration 102 already ships `verra_registry_projects` rows) become
the first populated registry in a `registry_credit_serials` table, with the interval-
overlap dedup check and the CORSIA rule (`vintage ≥ 2016 AND programme ∈ approved
list`) as computed screens rather than described ones.

**How.** (1) Serial ranges stored as int8 ranges with a GiST exclusion constraint —
cross-registry overlap becomes a DB-enforced impossibility plus a queryable violation
report for imported data. (2) CORSIA screen as a SQL view against the ICAO-approved
programme list (a small, versioned reference table — the list changes by ICAO Council
decision and must carry an `as_of`). (3) Replace the synthetic API-health panel with
honest status derived from actual ingest timestamps of `verraRegistryData`, or remove
it.

**Prerequisites.** Only Verra data is real today — Gold Standard/CAR/ACR/CDM balances
must stay clearly labelled demo until ingested; mismatch flag clears. **Acceptance:**
inserting an overlapping serial range fails with the conflicting range cited; the
CORSIA screen excludes a 2015-vintage fixture and includes a 2017 one.

### 9.2 Evolution B — Registry-operations copilot (LLM tier 1)

**What.** A copilot answering the operational questions this hub exists for: "is this
credit CORSIA-eligible and why?", "which registry has the lowest all-in fees for a 100kt
issuance?" (the fee-comparison table is real seeded reference data), "what are the
Verra retirement steps and typical durations?" (the `VERRA_WORKFLOW`/`GS_WORKFLOW`
stage tables). Grounded in this atlas page and — post-Evolution A — the computed CORSIA
screen; no tool-calling tier until real multi-registry endpoints exist.

**How.** Tier-1 pattern: atlas record plus the workflow/fee seed tables as corpus;
eligibility answers cite the rule *and* the credit's vintage/programme fields;
fee answers reproduce the comparison-table arithmetic. The prompt discloses which
registries' balances are real (Verra) versus demonstration.

**Prerequisites.** Evolution A's CORSIA view for eligibility answers that reflect
computed screens rather than the guide's prose; ICAO list version pinned in the corpus.
**Acceptance:** an eligibility answer names vintage, programme, and the list version
consulted; asked for a live Gold Standard account balance, the copilot states that
integration does not exist yet.