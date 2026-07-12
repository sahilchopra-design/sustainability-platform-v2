# CSRD ESRS Automation
**Module ID:** `csrd-esrs-automation` · **Route:** `/csrd-esrs-automation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automates CSRD data collection, validation, and ESRS disclosure generation across all 12 ESRS topical standards, using AI-assisted data extraction, cross-datapoint consistency checks, and XBRL tagging. Integrates with internal systems to minimise manual data entry and accelerate reporting cycles.

> **Business value:** Enables sustainability reporting teams to dramatically reduce manual data collection effort for CSRD, ensure ESRS cross-consistency, and produce audit-ready digital iXBRL filings that meet CSRD’s mandatory digital reporting requirements.

**How an analyst works this module:**
- Run double materiality assessment or import results to gate topical ESRS requirements
- Data Collection Dashboard shows all required data points with status, source, and quality weight
- Connect internal systems via API or upload templates to automate data ingestion
- Validation Engine runs cross-consistency checks and flags discrepancies for resolution
- ESRS Report Builder generates narrative disclosure and quantitative tables per standard
- XBRL Tagger applies ESRS taxonomy tags and exports iXBRL file for regulatory submission

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `ASSURANCE_EVIDENCE`, `CSRD_COMPANIES`, `DATAPOINT_INVENTORY`, `DMA_TOPICS`, `ESRS_STANDARDS`, `KPI`, `PAGE_SIZE`, `PIECLRS`, `READINESS_LEVELS`, `SECTORS`, `SectionHead`, `TABS`, `TOTAL_DATAPOINTS`, `TREND`, `XBRL_TAXONOMY`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ESRS_STANDARDS` | 13 | `id`, `name`, `category`, `dataPoints`, `mandatory`, `para`, `desc`, `subTopics` |
| `DMA_TOPICS` | 11 | `id`, `name`, `standard`, `category`, `impactWeight`, `financialWeight`, `desc` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `pct` | `v=>(v*100).toFixed(1)+'%';` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `TOTAL_DATAPOINTS` | `ESRS_STANDARDS.reduce((s,e)=>s+e.dataPoints,0); // 643` |
| `overallReadiness` | `Math.round(10+sr(base)*85);` |
| `gapCount` | `Math.round(sr(base+97)*45);` |
| `dataPointsCovered` | `Math.round(TOTAL_DATAPOINTS*(overallReadiness/100)*0.95+sr(base+101)*20);` |
| `automationRate` | `Math.round(10+sr(base+103)*80);` |
| `assuranceReady` | `Math.round(5+sr(base+107)*90);` |
| `taxonomyAlignment` | `Math.round(sr(base+109)*65);` |
| `doubleMateriality` | `Math.round(10+sr(base+113)*85);` |
| `dmaScores` | `DMA_TOPICS.map((t,ti)=>{` |
| `impactScore` | `+(1+sr(base+ti*31)*4).toFixed(1);` |
| `financialScore` | `+(1+sr(base+ti*37)*4).toFixed(1);` |
| `_india` | `adaptForPCAF().slice(0, 80).map((c, i) => {` |
| `scores` | `{}; ESRS_STANDARDS.forEach((std, j) => { scores[std.id] = Math.round(8 + sr(base + j * 17) * 87); });` |
| `sources` | `['HR System','ERP/Finance','GHG Accounting','Environmental Management','Procurement','Legal/Compliance','Board Secretariat','External Provider','Manual Collection','IoT/Sensor','Supply Chain Platform','Customer System'];` |
| `seed` | `idx*31+dp*7;` |
| `coverage` | `Math.round(sr(seed+3)*100);` |
| `source` | `sources[Math.floor(sr(seed+5)*sources.length)];` |
| `evidenceTypes` | `['Policy document','Board minutes','Data extract','Calculation methodology','Third-party verification','Audit trail','Interview notes','Process documentation','System screenshot','External certificate'];` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `dpPaged` | `filteredDPs.slice((dpPage-1)*PAGE_SIZE,dpPage*PAGE_SIZE);` |
| `dpTotalPages` | `Math.ceil(filteredDPs.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{ const avg=(k)=>Math.round(CSRD_COMPANIES.reduce((s,c)=>s+c[k],0)/(CSRD_COMPANIES.length\|\|1));` |
| `statusDist` | `useMemo(()=>{ const m={};CSRD_COMPANIES.forEach(c=>{m[c.status]=(m[c.status]\|\|0)+1;});` |
| `waveDist` | `useMemo(()=>{ const m={};CSRD_COMPANIES.forEach(c=>{m[c.reportingWave]=(m[c.reportingWave]\|\|0)+1;});` |
| `categoryDist` | `useMemo(()=>{ const cats={Environment:0,Social:0,Governance:0,'Cross-cutting':0};` |
| `avgImpact` | `+(dma.reduce((s,d)=>s+d.impactScore,0)/dma.length).toFixed(1);` |
| `avgFinancial` | `+(dma.reduce((s,d)=>s+d.financialScore,0)/dma.length).toFixed(1);` |
| `heatmapData` | `DMA_TOPICS.map((topic,ti)=>{` |
| `avgI` | `+(CSRD_COMPANIES.reduce((s,c)=>s+c.dmaScores[ti].impactScore,0)/CSRD_COMPANIES.length).toFixed(1);` |
| `avgF` | `+(CSRD_COMPANIES.reduce((s,c)=>s+c.dmaScores[ti].financialScore,0)/CSRD_COMPANIES.length).toFixed(1);` |
| `matPct` | `Math.round(CSRD_COMPANIES.filter(c=>c.dmaScores[ti].material).length/CSRD_COMPANIES.length*100);` |
| `sev` | `matBadge(Math.max(d.impactScore,d.financialScore));` |
| `crossStds` | `ESRS_STANDARDS.filter(s=>s.category==='Cross-cutting');` |
| `avgCoverage` | `Math.round(DATAPOINT_INVENTORY.reduce((s,d)=>s+d.coverage,0)/DATAPOINT_INVENTORY.length);` |
| `covByStd` | `ESRS_STANDARDS.map(std=>{` |
| `avg` | `dps.length?Math.round(dps.reduce((s,d)=>s+d.coverage,0)/dps.length):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DMA_TOPICS`, `ESRS_STANDARDS`, `PIECLRS`, `READINESS_LEVELS`, `SECTORS`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESRS Data Points (mandatory) | — | ESRS Set 1 | Number of mandatory disclosure data points across ESRS 2 and mandatory elements of topical standards |
| DMA Material Topics | — | ESRS 1 DMA process | Topics assessed as material under impact or financial materiality, driving topical ESRS disclosure |
| Data Collection Automation Rate | — | Platform connectivity | Proportion of required data points auto-populated from connected internal systems |
| XBRL Tag Coverage | — | ESRS XBRL Taxonomy | Quantitative data points with valid ESRS XBRL taxonomy tags for digital filing |
| Cross-Consistency Errors | — | Internal validation | Number of inconsistencies detected between same metric appearing in multiple ESRS locations |
- **Internal ERP/HR/energy management systems** → API integration or template upload to extract activity data → **Raw data input per ESRS data point**
- **ESRS requirement mapping engine** → Gate by DMA materiality, assign quality weights to each datapoint → **Data coverage score and gap register**
- **EFRAG ESRS XBRL taxonomy** → Tag quantitative disclosures, validate against taxonomy schema → **iXBRL digital filing package**

## 5 · Intermediate Transformation Logic
**Methodology:** ESRS Data Coverage Score
**Headline formula:** `Coverage = Σ(Datapoints_collected × Quality_weight) / Σ(Datapoints_required)`

Required data points are derived from ESRS materiality gating: ESRS 2 is mandatory for all; topical ESRS apply only where material per DMA. Quality weights: audited data = 1.0, management estimate = 0.6, proxy/analogy = 0.3. Cross-consistency check verifies that same metric (e.g., Scope 1 GHG) populates all referencing datapoints consistently across ESRS E1, ESRS 2 and transition plan.

**Standards:** ['CSRD Delegated Regulation (EU) 2023/2772', 'EFRAG ESRS Set 1 Guidance', 'ESRS XBRL Taxonomy 2023']
**Reference documents:** CSRD Delegated Regulation (EU) 2023/2772 â€” ESRS Set 1; EFRAG Implementation Guidance on Materiality Assessment; EFRAG ESRS XBRL Taxonomy 2023; ESRS Q&A Platform (EFRAG 2024)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Compute coverage from a real collection tally (analytics ladder: rung 1 → 2)

**What.** §7's partial-mismatch verdict: the ESRS reference layer is "real and
excellent" (12 standards with genuine paragraph citations, the correct 643-datapoint
total, DR-level subtopics) and real ISAE 3000 evidence-export helpers are already
wired — but every readiness, coverage, automation, and materiality *score* is
`sr()`-seeded, and the guide's quality-weighted formula
(`Coverage = Σ(collected × quality_weight)/Σ(required)` with 1.0/0.6/0.3 weights) is
unimplemented. Evolution A builds the tally the formula needs.

**How.** (1) Requirement gating: import the material-topic set from the sibling
`csrd-dma` module's persisted assessments (its scoring is real) — ESRS 2 always
required, topical standards gated by materiality, exactly as the guide describes;
delete the seeded `dmaScores`. (2) Collection ledger: a `csrd_datapoint_status`
table tracking each required datapoint's state (collected/estimated/proxy/missing)
with the guide's quality weights applied — populated manually first, then
increasingly by the platform modules that compute the values (Scope 1 from the
emissions engines, workforce from S1 sources). (3) Coverage, readiness, and
automation-rate KPIs become arithmetic over the ledger; the assurance-readiness
figure feeds the existing evidence-export helpers instead of a seed. (4) Coordinate
with `comprehensive-reporting`'s engine (its 62-DP IG3 checklist and consistency
rules are the adjacent, real machinery — this module is the collection workflow,
that one the compilation).

**Prerequisites (hard).** Seed purge; `csrd-dma` persistence (its own Evolution A);
the datapoint-ownership map across platform modules. **Acceptance:** coverage
reproduces as the weighted ledger sum; downgrading one datapoint from audited to
proxy moves coverage by exactly (1.0−0.3)/required; immaterial topics' datapoints
drop out of the denominator when the DMA changes.

### 9.2 Evolution B — Datapoint-extraction assistant for system onboarding (LLM tier 2)

**What.** The overview promises "AI-assisted data extraction" and "connect internal
systems… to minimise manual data entry" — unbuilt, and precisely the tier-2 shape.
Evolution B: uploaded evidence (utility bills, HR exports, policy PDFs) gets mapped
to ESRS datapoints — the assistant proposes `(datapoint_id, value, unit, quality
tier, source passage)` tuples against the real 643-datapoint register, with the
quality tier honestly proposed (a PDF policy statement is narrative evidence;
an audited GHG statement earns 1.0) — each proposal queued for preparer
confirmation before entering the Evolution A ledger.

**How.** Extraction prompts constrained to the datapoint register's schema
(paragraph citations from the reference layer make requirement disambiguation
tractable); confirmation workflow per the roadmap's gated-mutation contract, with
the ISAE 3000 evidence-package helpers storing the source linkage — the extraction
is only defensible if the assurer can walk from datapoint to source. Validation:
unit checks and the cross-consistency rules from `comprehensive-reporting`'s engine
run on proposals before they're even shown.

**Prerequisites (hard).** Evolution A's ledger; document upload path; the
consistency-rule integration. **Acceptance:** on a test evidence pack, ≥85% of
proposed mappings confirmed unchanged by a human reviewer; every accepted value
carries its source passage; no proposal auto-enters the ledger.