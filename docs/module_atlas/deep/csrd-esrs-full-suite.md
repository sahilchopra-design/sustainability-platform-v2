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
