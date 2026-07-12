## 7 · Methodology Deep Dive

The guide describes an *ESRS Data Coverage Score* — `Coverage = Σ(Datapoints_collected ×
Quality_weight) / Σ(Datapoints_required)` with quality weights (audited 1.0, estimate 0.6, proxy 0.3).
The code's **reference structure is real and excellent** (12 ESRS standards with genuine paragraph
citations, real datapoint counts, DR-level subtopics, and DMA_TOPICS with impact/financial weights),
but the **readiness, coverage, automation and datapoint-inventory numbers are all `sr()`-seeded**, not
derived from any collected-vs-required tally. Partial mismatch: the framework is faithful, the *scores*
are synthetic.

### 7.1 What the module computes

Company-readiness KPIs are generated from a base seed, not measured:
```js
overallReadiness   = round(10 + sr(base)·85)          // 10–95
gapCount           = round(sr(base+97)·45)
dataPointsCovered  = round(TOTAL_DATAPOINTS·(overallReadiness/100)·0.95 + sr(base+101)·20)
automationRate     = round(10 + sr(base+103)·80)
assuranceReady     = round(5 + sr(base+107)·90)
taxonomyAlignment  = round(sr(base+109)·65)
doubleMateriality  = round(10 + sr(base+113)·85)
```
Double-materiality topic scores are also seeded (`impactScore = 1 + sr(base+ti·31)·4`, 1–5), then
compared against `impactWeight`/`financialWeight` to flag material topics. `TOTAL_DATAPOINTS = 643` is
the *real* sum of the 12 standards' datapoint counts.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| 12 ESRS standards | ESRS 1 (65 dp), ESRS 2 (78), E1 (82), S1 (91), … | **real** — EFRAG ESRS Set 1, with §-citations |
| TOTAL_DATAPOINTS | 643 | **real** — sum of the 12 counts |
| DMA topic weights | E1 impact 0.30 / financial 0.35; E2 0.08/0.06; … | curated (materiality priors) |
| Materiality badge | ≥4 Critical, ≥3 High, ≥2 Moderate, else Low | display heuristic |
| Quality weights | audited 1.0 / estimate 0.6 / proxy 0.3 (in guide) | **not implemented** in code |
| Readiness / coverage / automation / assurance | `sr()`-seeded | synthetic seeded |
| Datapoint coverage per DP | `round(sr(idx·31+dp·7 +3)·100)` | synthetic seeded |
| Data sources / evidence types | 12 sources / 10 evidence types | curated realistic lists |

### 7.3 Calculation walkthrough

A company seed drives all readiness KPIs. `dmaScores` seeds each topic's impact/financial score →
`material` if it exceeds threshold → heatmap and radar aggregate across the seeded `CSRD_COMPANIES`.
`DATAPOINT_INVENTORY` assigns each datapoint a seeded coverage %, source and evidence type; `covByStd`
averages coverage per standard. Real ISAE 3000 evidence-export helpers (`buildEvidencePackage`,
`getPortfolioAssuranceReadiness`) are imported and wired to the Export tab.

### 7.4 Worked example (company readiness)

For a company with `base` seed such that `sr(base) ≈ 0.70`:
```
overallReadiness  = round(10 + 0.70·85) = round(69.5) = 70
dataPointsCovered = round(643·(70/100)·0.95 + sr(base+101)·20) ≈ round(427.6 + ~10) = 438
automationRate    = round(10 + sr(base+103)·80) ∈ [10,90]
```
The 643 anchor and the 0.95 haircut are real/structured, but the readiness driver (0.70) is a seeded
placeholder — so `dataPointsCovered` looks precise yet is not a measured count.

### 7.5 Data provenance & limitations

- **ESRS reference data (standards, datapoint counts, §-paragraphs, DR subtopics, DMA topic list) is
  real** and citable — one of the better-referenced reference layers in the atlas.
- **All readiness/coverage/automation/materiality *scores* are `sr()`-seeded**; the guide's
  quality-weighted coverage formula is not implemented.
- The materiality-weight priors (impact 0.30 for E1, etc.) are author judgement, not entity DMA output.

**Framework alignment:** CSRD Delegated Reg (EU) 2023/2772 · EFRAG ESRS Set 1 (ESRS 1 §38-62 double
materiality; ESRS 2 GOV/SBM/IRO/MDR pillars; E1–E5/S1–S4/G1 with real datapoint counts and DR IDs) ·
ISAE 3000 assurance (evidence-export helper). The structure faithfully mirrors the standards; the
coverage/readiness engine is a seeded placeholder for the guide's quality-weighted model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Readiness and coverage scores are seeded; the
quality-weighted coverage model named in the guide is absent.

**8.1 Purpose & scope.** Compute a defensible ESRS data-coverage / assurance-readiness score per entity
by tallying actually-collected datapoints against DMA-gated required datapoints, weighted by data
quality — for CSRD reporting-cycle management.

**8.2 Conceptual approach.** A **quality-weighted completeness ratio** with **DMA materiality gating**,
mirroring EFRAG's ESRS data-quality tiers and the coverage logic in Workiva/Novata CSRD tools; assurance
readiness follows ISAE 3000/3410 limited-assurance evidence sufficiency.

**8.3 Mathematical specification.**
```
Required = ESRS2_datapoints + Σ_{topic material} topical_datapoints_topic      # DMA-gated
Collected_weighted = Σ_{dp collected} QualityWeight(dp)                         # 1.0/0.6/0.3
Coverage = Collected_weighted / Required
AssuranceReady = (dp with source-linked evidence) / Required
CrossConsistency errors = # metrics whose value differs across referencing DRs
```

| Parameter | Source |
|---|---|
| Datapoint requirements | EFRAG ESRS Set 1 (exists in module) |
| Materiality gating | DMA output (csrd-dma module) |
| Quality weights | EFRAG data-quality tiers (audited/estimate/proxy) |
| Evidence links | data-lineage / provenance layer |

**8.4 Data requirements.** Per-datapoint collected value + provenance flag + quality tier; DMA material-
topic set; ESRS requirement map (exists). Sources: internal ERP/HR/GHG systems, DMA module. The
platform already holds the ESRS map and an ISAE 3000 evidence helper.

**8.5 Validation & benchmarking.** Reconcile required-datapoint count to EFRAG's gated tally for a
given DMA; verify quality weights lower coverage correctly; benchmark cross-consistency detection
against known duplicate-metric errors; compare readiness to auditor evidence checklists.

**8.6 Limitations & model risk.** Materiality gating drives required-datapoint count — an incomplete
DMA understates the denominator; quality-tier classification is judgement-heavy. Fallback: show
coverage *before and after* gating so the DMA assumption is transparent.
