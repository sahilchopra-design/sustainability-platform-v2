# CSRD ESRS Full Suite
**Module ID:** `csrd-esrs-full-suite` · **Route:** `/csrd-esrs-full-suite` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Complete CSRD European Sustainability Reporting Standards implementation. Covers ESRS 2 (General), E1-E5 (Environmental), S1-S4 (Social), G1 (Governance). Includes double materiality assessment and IRO register.

> **Business value:** CSRD applies to ~50,000 EU and non-EU companies from 2024-2028 phased rollout. ESRS disclosures will be publicly available and machine-readable. This module provides the complete double materiality assessment and disclosure drafting system required for compliance.

**How an analyst works this module:**
- Double Materiality Matrix maps all topics by financial vs impact significance
- IRO Register tracks Impacts, Risks, and Opportunities per topic
- ESRS 2 Hub covers mandatory general disclosures (strategy, governance, stakeholders)
- E1 Climate covers 6 DRs (transition plan, physical risk, GHG, energy, carbon offsets)
- S1-S4 Social standards cover own workforce, value chain workers, communities, consumers
- Audit Trail documents materiality determination with evidence

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `E1_DRS`, `E2_DRS`, `E3_DRS`, `E4_DRS`, `E5_DRS`, `ESRS_OVERVIEW`, `STATUS_COLORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ESRS_OVERVIEW` | 6 | `drs`, `datapoints`, `complete`, `financial`, `impact` |
| `E1_DRS` | 10 | `status`, `score` |
| `E2_DRS` | 7 | `status`, `score` |
| `E3_DRS` | 6 | `status`, `score` |
| `E4_DRS` | 7 | `status`, `score` |
| `E5_DRS` | 7 | `status`, `score` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalDrs` | `ESRS_OVERVIEW.reduce((s,e)=>s+e.drs,0);` |
| `totalDps` | `ESRS_OVERVIEW.reduce((s,e)=>s+e.datapoints,0);` |
| `avgComplete` | `Math.round(ESRS_OVERVIEW.reduce((s,e)=>s+e.complete,0)/ESRS_OVERVIEW.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `E1_DRS`, `E2_DRS`, `E3_DRS`, `E4_DRS`, `E5_DRS`, `ESRS_OVERVIEW`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESRS Standards | — | EFRAG | ESRS 2 + E1-5 + S1-4 + G1 |
| Cross-Cutting | — | EFRAG | General principles and general disclosures — always required |
| Conditional Standards | — | EFRAG | E1-E5, S1-S4, G1 — only if material |
| Double Materiality | — | CSRD | Two-sided test triggering disclosure obligations |
- **IRO identification** → Double materiality scoring → **Material topics determination**
- **Material ESRS topics** → DR-level data collection → **ESRS disclosures**
- **ESRS disclosures** → ESEF XBRL tagging → **Machine-readable regulatory filing**

## 5 · Intermediate Transformation Logic
**Methodology:** ESRS double materiality
**Headline formula:** `IRO_material = FinancialMateriality OR ImpactMateriality (either triggers)`

Double materiality: (1) Impact materiality = significant actual or potential impact on people/environment, (2) Financial materiality = significant risk or opportunity for company value. Topic triggers disclosure if either test is met. IRO = Impact, Risk, Opportunity.

**Standards:** ['EFRAG ESRS Set 1 (2023)', 'EU CSRD Delegated Act']
**Reference documents:** EFRAG ESRS Set 1 (2023); EU CSRD Directive (2022/2464); EU CSRD Delegated Act on ESRS; GRI-ESRS Interoperability Index

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide is honest: this is the *complete CSRD ESRS implementation* with a `IRO_material =
FinancialMateriality OR ImpactMateriality` dual test. The code implements the ESRS structure faithfully
(ESRS 2 + E1–E5 + S1–S4 + G1, DR-level breakdown), but its completion/score data is **hard-coded
static demo values**, not computed from any assessment — and (per the REM backlog) the E1 DR list has
historically over-listed disclosure requirements. No PRNG is used; the numbers are simply authored
constants.

### 7.1 What the module computes

Very little is *computed* — the module is a structured status tracker. The only aggregations:
```js
totalDrs     = Σ ESRS_OVERVIEW.drs
totalDps     = Σ ESRS_OVERVIEW.datapoints
avgComplete  = round(Σ ESRS_OVERVIEW.complete / ESRS_OVERVIEW.length)
```
Each environmental standard (E1–E5) has a DR array with a hard-coded `status` and `score` (0–100
completeness) per disclosure requirement, rendered as bar + table. The dual-materiality principle is
described in the overview but the material/non-material flags are the static `financial`/`impact`
fields, not a live OR-test on user inputs.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| ESRS_OVERVIEW | E1 (12 DR, 40 dp, 68% complete), E2 (6/18/42%), … | hard-coded demo (structure real, values static) |
| E1_DRS | E1-1…E1-9 with status + score (85/82/78/65/90/88/55/42/60) | hard-coded demo |
| E2/E3/E4/E5 DRS | per-DR status/score constants | hard-coded demo |
| Status colours | Complete green / In Progress blue / Draft amber / Not Started red | display |
| Dual-materiality test | `Financial OR Impact` (described) | **real ESRS 1 rule**, but flags are static |

Note: the guide claims "E1 covers 6 DRs" but the code's `E1_DRS` lists 9 (E1-1…E1-9) which matches the
real ESRS E1 disclosure requirements — the code is closer to correct than the guide here, though the
REM backlog flagged historical over-listing (E1-10/11/12) that appears since corrected.

### 7.3 Calculation walkthrough

Static arrays render directly. Overview tab sums DRs/datapoints and averages completion across E1–E5.
Each topical tab (`renderDRTab`) draws a horizontal bar of per-DR completeness coloured by status, plus
a table with a progress bar. No user input flows into scores; the double-materiality matrix plots the
static `financial`/`impact` coordinates.

### 7.4 Worked example (Overview aggregation)

From `ESRS_OVERVIEW` (E1 68, E2 42, E3 38, E4 28, E5 35):
```
avgComplete = round((68 + 42 + 38 + 28 + 35) / 5) = round(211/5) = round(42.2) = 42%
totalDrs    = 12 + 6 + 5 + 6 + 6 = 35
totalDps    = 40 + 18 + 15 + 22 + 20 = 115
```
These are the only genuinely computed figures; every input is a hand-set constant reflecting a
plausible "reporter mid-journey" profile (E1 most advanced, E4 biodiversity least).

### 7.5 Data provenance & limitations

- **All completion scores and statuses are hard-coded demo constants**; the module is a display shell,
  not a live assessment engine.
- The ESRS *structure* (standards, DR identifiers, dual-materiality principle) is real and correct.
- No connection to the DMA module, no user-editable status, no data-collection tally — completeness is
  illustrative only.

**Framework alignment:** EFRAG ESRS Set 1 · CSRD Directive 2022/2464 + Delegated Act · ESRS 1 double
materiality (impact OR financial, no netting — correctly stated) · GRI-ESRS interoperability. The DR
taxonomy is faithful; the numbers are a static mock-up of a reporter's progress.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Completion/materiality figures are hard-coded;
no assessment engine exists behind them.

**8.1 Purpose & scope.** Track ESRS disclosure-requirement completion and material-topic determination
across all 12 standards, driven by real DMA output and data-collection status, for CSRD reporting.

**8.2 Conceptual approach.** A **DR-level completeness ledger gated by a live DMA dual-materiality
test** — the model behind Workiva/Novata/Position Green CSRD tools. Materiality is `Impact OR
Financial` (ESRS 1, no netting); completeness rolls DR → standard → report.

**8.3 Mathematical specification.**
```
Material(topic) = ImpactMaterial(topic) OR FinancialMaterial(topic)          # from DMA module
RequiredDRs = ESRS2_DRs ∪ ⋃_{topic material} topical_DRs
Completeness(DR) = collected_datapoints(DR) / required_datapoints(DR)
Standard_complete = mean_{DR∈std} Completeness(DR)
Report_complete = Σ_DR w_DR·Completeness(DR) / Σ w_DR                         # w by datapoint count
```

| Parameter | Source |
|---|---|
| Material flags | csrd-dma module (severity×likelihood + magnitude×likelihood) |
| DR datapoint counts | EFRAG ESRS Set 1 |
| Collected datapoints | data-capture / data-lineage layer |

**8.4 Data requirements.** Live DMA material-topic set; per-DR datapoint requirements (exist); collected
datapoint counts with evidence. Sources: csrd-dma module, internal systems. No new external data.

**8.5 Validation & benchmarking.** Verify required-DR set matches the DMA gating; reconcile standard
completeness to underlying datapoint tallies; benchmark against auditor DR checklists.

**8.6 Limitations & model risk.** Completeness ≠ correctness (a filled DR may still fail assurance);
DMA gating is upstream-dependent. Fallback: separate "collected" from "assured" and show both.

## 9 · Future Evolution

### 9.1 Evolution A — From static mock-up to live status tracker (analytics ladder: rung 1 → 2)

**What.** §7 is clear about what this is: a faithful ESRS structural shell (correct
DR taxonomy — the code's 9 E1 DRs are *more* correct than the guide's claimed 6 —
correct dual-materiality principle, real standards breakdown) whose every
completion score and status is a hard-coded constant. No PRNG, but also no
computation: "no connection to the DMA module, no user-editable status, no
data-collection tally — completeness is illustrative only" (§7.5). Evolution A
makes the shell live, deliberately as a *view* over the platform's other CSRD
machinery rather than a fourth parallel implementation.

**How.** (1) Materiality flags from `csrd-dma`'s persisted assessments (real
scoring exists there) — the double-materiality matrix plots actual entity scores,
and the static `financial`/`impact` fields disappear. (2) DR-level completeness
from `csrd-esrs-automation`'s collection ledger (its Evolution A) aggregated to
this module's DR bars — one tally, two granularities. (3) User-editable status and
the IRO register persist server-side; the audit-trail tab documents materiality
determinations with evidence links, which is this module's distinctive promise.
(4) Rationalize the CSRD family: this suite becomes the navigator/status view,
`csrd-dma` the assessment engine, `csrd-esrs-automation` the collection workflow,
`comprehensive-reporting` the compiler, `csrd-ixbrl` the tagger — the Atlas
interconnection map should reflect the pipeline instead of five islands.

**Prerequisites (hard).** The sibling modules' Evolutions A (this module is
downstream by design); agreement on the family division of labor to avoid four
competing completeness numbers. **Acceptance:** the overview's `avgComplete`
reproduces from the shared ledger; changing a DMA materiality flips a topical
standard's required state here; zero hard-coded scores remain.

### 9.2 Evolution B — ESRS navigator copilot for reporting teams (LLM tier 1)

**What.** The suite's breadth — all 12 standards, DR-level detail, the IRO
register — makes it the natural home for orientation questions reporting teams
actually ask: "what does E1-3 require and where are we on it?", "which DRs does our
S2 materiality trigger?", "what's the difference between MDR-P and MDR-A
disclosures?" Evolution B answers from the module's structural data and (post-
Evolution A) live status: requirement explanations grounded in the real DR
taxonomy and ESRS paragraph citations, status answers from the ledger, always
distinguishing the two.

**How.** Tier-1 RAG: the ESRS reference layer (this module's genuine asset) plus
the EFRAG guidance texts in refdata; live status passes as context. The navigator
explicitly does not draft disclosures — that's `comprehensive-reporting`'s
Evolution B — it orients and routes, linking each answer to the module tab or
sibling module where the work happens; the roadmap's module-copilot pattern with a
routing flavor.

**Prerequisites.** Corpus embedding (D3); Evolution A for status questions (until
then the copilot must state that completion figures are illustrative).
**Acceptance:** requirement explanations cite ESRS paragraphs; status answers match
the ledger exactly; drafting requests are routed to the correct sibling module
rather than attempted.