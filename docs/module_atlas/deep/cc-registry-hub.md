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
