# Comprehensive Reporting Suite
**Module ID:** `comprehensive-reporting` · **Route:** `/comprehensive-reporting` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Generates end-to-end sustainability reports across CSRD/ESRS, TCFD, ISSB S1/S2, and GRI standards from a single data model, ensuring cross-framework consistency and traceability. Supports double materiality assessment outputs, quantitative KPI tables, and XBRL-tagged digital disclosure packages.

> **Business value:** Enables sustainability reporting teams to produce consistent, audit-ready multi-framework reports from a single data entry workflow, eliminating reconciliation gaps and ensuring compliance with CSRD digital filing requirements.

**How an analyst works this module:**
- Run double materiality assessment or import existing assessment results
- Data Collection tab shows all required metrics with current status and source
- Framework Mapper shows how each data point populates across CSRD/ISSB/GRI/TCFD simultaneously
- Report Builder generates narrative sections with embedded quantitative tables per framework
- XBRL Tagger applies ESRS taxonomy tags to quantitative disclosures for digital filing
- Export complete report package as PDF, HTML, and iXBRL for regulatory submission

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `DATAPOINT_MAP`, `FRAMEWORKS`, `FW_DATA`, `Kpi`, `PIE_C`, `Row`, `SUBMISSIONS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FRAMEWORKS` | 9 | `id`, `name`, `fullName`, `jurisdiction`, `deadline`, `status`, `totalDatapoints`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Multi-Framework Dashboard','Datapoint Mapper','Report Builder','Submission Tracker'];` |
| `generateFrameworkData` | `()=>FRAMEWORKS.map((fw,fi)=>{` |
| `coverage` | `Math.round(30+sr(fi*7)*60);` |
| `gapCount` | `Math.round(fw.totalDatapoints*(100-coverage)/100);` |
| `sections` | `Array.from({length:5+Math.floor(sr(fi*11)*5)},(_,si)=>{` |
| `names` | `sectionNames[fw.id]\|\|[`Section ${si+1}`];` |
| `filled` | `Math.round(dp*coverage/100+sr(fi*50+si*17)*dp*0.1);` |
| `alignedWith` | `FRAMEWORKS.filter((_,ofi)=>ofi!==fi&&sr(fi*100+di*50+ofi*7)>0.4).map(f=>f.id);` |
| `SUBMISSIONS` | `FRAMEWORKS.map((fw,fi)=>({` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.create` |
| `avgCoverage` | `Math.round(FW_DATA.reduce((a,f)=>a+f.coverage,0)/FW_DATA.length);` |
| `totalDatapoints` | `FRAMEWORKS.reduce((a,f)=>a+f.totalDatapoints,0);` |
| `totalGaps` | `FW_DATA.reduce((a,f)=>a+f.gapCount,0);` |
| `coverageData` | `FW_DATA.map(f=>({name:f.name,coverage:f.coverage,gaps:100-f.coverage}));` |
| `radarData` | `FW_DATA.map(f=>({framework:f.name,coverage:f.coverage,quality:f.qualityScore,automation:f.automationPct}));` |
| `overlapPct` | `Math.round(overlapCount/fw1Points.length*100);` |
| `totalDp` | `selectedSections.reduce((a,s)=>a+s.datapoints,0);` |
| `filledDp` | `selectedSections.reduce((a,s)=>a+s.filled,0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/comprehensive-reporting/compile` | `compile_report` | api/v1/routes/comprehensive_reporting.py |
| POST | `/api/v1/comprehensive-reporting/esrs-report` | `generate_esrs_report` | api/v1/routes/comprehensive_reporting.py |
| POST | `/api/v1/comprehensive-reporting/xbrl-tag` | `generate_xbrl_tagging` | api/v1/routes/comprehensive_reporting.py |
| POST | `/api/v1/comprehensive-reporting/consistency-check` | `check_cross_framework_consistency` | api/v1/routes/comprehensive_reporting.py |
| POST | `/api/v1/comprehensive-reporting/readiness-score` | `calculate_readiness_score` | api/v1/routes/comprehensive_reporting.py |
| GET | `/api/v1/comprehensive-reporting/ref/framework-mapping` | `get_framework_mapping` | api/v1/routes/comprehensive_reporting.py |
| GET | `/api/v1/comprehensive-reporting/ref/esrs-checklist` | `get_esrs_checklist` | api/v1/routes/comprehensive_reporting.py |
| GET | `/api/v1/comprehensive-reporting/ref/xbrl-concepts` | `get_xbrl_concepts` | api/v1/routes/comprehensive_reporting.py |
| GET | `/api/v1/comprehensive-reporting/ref/consistency-rules` | `get_consistency_rules` | api/v1/routes/comprehensive_reporting.py |

### 2.3 Engine `comprehensive_reporting_engine` (services/comprehensive_reporting_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ComprehensiveReportingEngine.compile_report` | entity_id, frameworks, engine_outputs, reporting_year | Full multi-framework report with completeness, consistency, and assurance readiness. |
| `ComprehensiveReportingEngine.generate_esrs_report` | entity_id, engine_outputs, wave, reporting_year | Full ESRS disclosure set with DP completeness, gap analysis, and priority actions. |
| `ComprehensiveReportingEngine.generate_xbrl_tagging` | entity_id, quantitative_dps | Generate XBRL instance document structure (EFRAG ESRS-XBRL-2024-01-01). |
| `ComprehensiveReportingEngine.check_cross_framework_consistency` | entity_id, multi_framework_data | Evaluate 20 consistency rules across frameworks. |
| `ComprehensiveReportingEngine.calculate_readiness_score` | entity_id, frameworks, engine_outputs, wave | Calculate overall reporting readiness with blocking vs advisory gap classification. |
| `ComprehensiveReportingEngine._build_framework_sections` | framework, engine_outputs, reporting_year | Build report sections for a given framework based on engine outputs. |
| `ComprehensiveReportingEngine._calculate_topic_completeness` | engine_outputs | Per-ESRS standard completeness score. |
| `ComprehensiveReportingEngine._calculate_assurance_pct` | completeness, consistency | Proxy assurance readiness from completeness and consistency scores. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `EFRAG`, `__future__` *(shared)*, `all`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*, `upstream` *(shared)*
**Frontend seed datasets:** `FRAMEWORKS`, `PIE_C`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Framework Coverage | — | Platform mapping | Active reporting frameworks covered in unified data model and report generation |
| Data Point Coverage | — | ESRS/ISSB requirement register | Percentage of required disclosure data points populated with primary or estimated data |
| Cross-Framework Consistency | — | Internal reconciliation | Agreement rate between same metrics reported under different frameworks in the same period |
| XBRL Tag Coverage | — | ESRS Taxonomy | Proportion of quantitative disclosures with valid ESRS XBRL taxonomy tags applied |
| Double Materiality Topics | — | ESRS 1 methodology | Number of ESRS topics assessed as material under impact or financial materiality criteria |
- **Platform ESG data model** → Map metrics to all active framework data point requirements → **Cross-framework disclosure matrix**
- **Double materiality assessment outputs** → Gate topic disclosure requirements, apply omission justifications → **Topic materiality flags**
- **ESRS XBRL taxonomy** → Match quantitative disclosures to taxonomy elements, generate tagged output → **iXBRL digital filing package**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/comprehensive-reporting/ref/consistency-rules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'total_rules', 'blocking_rules', 'advisory_rules', 'frameworks_covered', 'filter_applied', 'ifrs_s1_s2_checklist_count', 'rules'], 'n_keys': 8}`

**GET /api/v1/comprehensive-reporting/ref/esrs-checklist** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'total_dps_in_checklist', 'mandatory_dps', 'phase_in_relief_dps', 'standards_summary', 'csrd_waves', 'checklist'], 'n_keys': 7}`

**GET /api/v1/comprehensive-reporting/ref/framework-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'total_dp_mappings', 'mandatory_dps', 'frameworks_covered', 'source_engines_referenced', 'filter_applied', 'mappings'], 'n_keys': 7}`

**GET /api/v1/comprehensive-reporting/ref/xbrl-concepts** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['taxonomy_version', 'taxonomy_ref', 'source', 'esap_mandate', 'concept_count', 'data_type_distribution', 'filter_applied', 'concepts'], 'n_keys': 8}`

**POST /api/v1/comprehensive-reporting/compile** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/comprehensive-reporting/consistency-check** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/comprehensive-reporting/esrs-report** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/comprehensive-reporting/readiness-score** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Cross-Framework Data Harmonisation
**Headline formula:** `Disclosure_coverage = Σ(Mapped_datapoints) / Σ(Required_datapoints)`

A shared data ontology maps each underlying metric to all frameworks that require it (e.g., Scope 1 emissions populates ESRS E1-6, ISSB S2 para 29, GRI 305-1, and TCFD Metrics simultaneously). Materiality flags from double materiality assessment gate which ESRS topics require full disclosure vs. omission justification. Quality tiers (measured, estimated, proxy) propagate to disclosure confidence ratings.

**Standards:** ['CSRD/ESRS 2023', 'ISSB IFRS S1/S2', 'GRI Universal 2021', 'TCFD 2021']
**Reference documents:** CSRD Delegated Regulation (EU) 2023/2772 â€” ESRS Set 1; ISSB IFRS S1 and S2 (June 2023); GRI Universal Standards 2021; TCFD Recommendations 2021 â€” Final Report; EFRAG ESRS XBRL Taxonomy 2023

**Engine `comprehensive_reporting_engine` — extracted transformation lines:**
```python
fw_completeness[fw] = round(provided / max(total, 1) * 100, 1)
overall = round(sum(fw_completeness.values()) / max(len(fw_completeness), 1), 1)
provided_mandatory_dps=len(provided_hard) + len(provided_phase_in),
deviation_pct = (max_v - min_v) / max_v * 100
consistency_score = round(rules_passed / max(rules_evaluated, 1) * 100, 1)
rules_failed=rules_evaluated - rules_passed,
overall = round(sum(fw_readiness.values()) / max(len(fw_readiness), 1), 1)
gap = max(0, 90 - overall)
weeks = int(math.ceil(gap / 10 * 2))
completeness = round(provided / max(required, 1) * 100, 1)
raw = completeness * 0.6 + consistency * 0.4
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `credit-spread-climate-monitor` | table:upstream |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a single-data-model report generator with
> double-materiality gating, XBRL tagging, and iXBRL export driven from real platform metrics.
> The **backend engine** (`comprehensive_reporting_engine.py`, E119) genuinely implements most of
> that — a 74-row cross-framework DP mapping, a 62-DP ESRS IG3 checklist, 50 EFRAG XBRL concepts,
> 20 consistency rules, and readiness scoring exposed at
> `POST /api/v1/comprehensive-reporting/{compile ▸ esrs-report ▸ consistency-check ▸ readiness-score}`.
> **But the React page never calls any of it.** Every number on screen (coverage %, quality score,
> automation %, submission status) is fabricated with the seeded PRNG `sr()`. The DMA gating and
> iXBRL export described in the guide exist nowhere. Sections 7.1–7.4 document the page; 7.5
> documents the real engine; §8 specifies the wiring/measurement model that should replace the
> synthetic layer.

### 7.1 What the page computes (frontend, all synthetic)

For 8 frameworks (`FRAMEWORKS`: CSRD 1,144 datapoints, GRI 387, CDP 256, ISSB 218, SEC 142,
TCFD 93, UK SDR 85, SFDR 64 — the datapoint totals are hand-authored but plausible; EFRAG's ESRS
Set-1 full DP count is ≈1,100–1,200):

```js
coverage      = round(30 + sr(fi*7)  * 60)                       // 30–90 %
gapCount      = round(totalDatapoints * (100 − coverage) / 100)
sections[si]  : dp     = round(totDp*0.05 + sr(fi*50+si*13)*totDp*0.2)
                filled = min(dp, round(dp*coverage/100 + sr(fi*50+si*17)*dp*0.1))
                status = filled/dp > 0.8 ? 'Complete' : > 0.5 ? 'In Progress' : 'Gap'
qualityScore  = round(40 + sr(fi*31) * 50)                       // 40–90
automationPct = round(20 + sr(fi*37) * 60)                       // 20–80 %
```

Dashboard KPIs: `avgCoverage = Σcoverage/8`, `totalDatapoints = Σ = 2,389`,
`totalGaps = Σ gapCount`. The Datapoint Mapper builds 8 × 20 = 160 synthetic datapoints over a
fixed 20-topic list; alignment between frameworks is random: a datapoint "aligns with" another
framework iff `sr(fi*100+di*50+ofi*7) > 0.4` (~60% chance per pair). Overlap KPI:
`overlapPct = round(overlapCount / 20 × 100)`. The 6×6 overlap-matrix heatmap uses yet another
seed, `20 + sr(i1*50+i2*13)*60`, unrelated to the datapoint-level alignment — the two views can
contradict each other. Submission Tracker rows draw status from
`['Submitted','In Review','Draft','Not Started','Overdue'][floor(sr(fi*7)*5)]` with
`completeness = 20 + sr(fi*13)*75` and a fabricated audit trail.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Framework DP totals | 1144 / 64 / 218 / 93 / 387 / 256 / 85 / 142 | Hand-authored; CSRD figure consistent with EFRAG ESRS Set-1 scale |
| Coverage band | 30–90% | Synthetic demo range |
| Section status cuts | >80% Complete, >50% In Progress | Synthetic demo thresholds |
| Alignment probability | `sr(...) > 0.4` | Synthetic (no mapping table used on the page) |
| Section name lists | ESRS E1–G1, SFDR PAI/pre-contractual/periodic, ISSB pillars, GRI series, CDP modules… | Real framework structure (labels only) |

### 7.3 Calculation walkthrough

Tab 0 renders coverage stacked bars + a coverage/quality/automation radar and per-section progress
for the selected framework. Tab 1 filters the 160-row synthetic map by category/search/overlap
and shows the E/S/G pie and the 6×6 heatmap. Tab 2 (Report Builder) is the only genuinely
interactive computation: for user-selected sections it aggregates
`totalDp = Σ datapoints`, `filledDp = Σ filled`, completion `= round(filledDp/totalDp×100)`, and
exports section/gap CSVs. Tab 3 sorts `SUBMISSIONS` and charts completeness vs gap.

### 7.4 Worked example — CSRD card (fi = 0)

`sr(0) = frac(sin(1)×10⁴) = frac(8414.7098) = 0.70985` → coverage `= round(30 + 0.70985×60)` =
**73%**. Gap count `= round(1144 × 27/100)` = **309** open CSRD gaps. Quality
`= round(40 + sr(0)×50)` = 40 + 35.5 = **75** (seed `fi*31 = 0` reuses `sr(0)`), automation
`= round(20 + 0.70985×60)` = **63%**. All four figures are functions of one PRNG draw — not data.

### 7.5 The real backend engine (E119) — implemented but unwired

- **`compile_report`**: per-framework completeness = complete sections / total sections (a section
  is "complete" at ≥90% of its DPs provided); frameworks <70% complete raise *blocking* gaps,
  70–90% *advisory*; assurance readiness `= 0.6×completeness + 0.4×consistency` (ISAE 3000 proxy);
  `esap_ready` requires CSRD ≥90% **and** `E1-6_s1` (Scope 1) present.
- **`generate_esrs_report`**: checks provided outputs against the 62-DP ESRS IG3 quantitative
  checklist (each DP has `mandatory`, `phase_in` year, `topic_weight` 0.8–2.0); assurance tier
  ≥95% ready / ≥80% nearly / ≥60% remediation / else not-ready; priority gaps = top-10 blocking
  DPs by weight. CSRD waves 1–4 (NFRD PIEs 2024 → non-EU 2028) carry phase-in relief lists.
- **`generate_xbrl_tagging`**: maps DP ids to 50 EFRAG `ESRS-XBRL-2024-01-01` concepts, emits an
  XBRL 2.1 instance structure (contexts, units, facts; decimals −3 for monetary, 2 otherwise),
  and returns untagged DPs as validation warnings.
- **`check_cross_framework_consistency`**: 20 rules (e.g. CR-001 Scope 1 must agree across
  ESRS E1-6 / SFDR PAI-1 / TCFD / IFRS S2 / GRI 305-1 within 5%); test statistic
  `deviation = (max−min)/max×100` vs per-rule `tolerance_pct`; missing data (<2 DPs) fails the
  rule at its severity. Score = rules passed / 20.
- **`calculate_readiness_score`**: per-framework proxy DP lists (TCFD 6 DPs, IFRS S2 6, GRI 5,
  SFDR 6, TNFD 4); overall = mean; tier ≥90 ready / ≥70 nearly / ≥50 remediation; effort estimate
  `weeks = ceil((90 − overall)/10 × 2)` (2 weeks per 10 pts of gap — a stated heuristic).

### 7.6 Data provenance & limitations

- **Frontend**: 100% synthetic — every metric derives from `sr(seed)=frac(sin(seed+1)×10⁴)`.
  Framework names, section labels, and DP-count magnitudes are the only real content.
- **Backend**: reference tables are hand-curated from public standards (EFRAG IG3 2024, EFRAG
  ESRS XBRL Taxonomy 2024, SFDR RTS 2022/1288, IFRS S1/S2, TCFD 2021 annex, TNFD v1.0, GRI 2021);
  the 62-DP IG3 subset is a sample of the full ≈330 quantitative mandatory DPs the docstring
  cites. Completeness is presence-based (`dp_id in engine_outputs`) — value plausibility is only
  tested by the 20 consistency rules.
- No DMA gating anywhere: materiality does not filter which DPs count as required.
- The page's overlap heatmap and datapoint alignment are mutually inconsistent PRNG draws.

### 7.7 Framework alignment

- **CSRD/ESRS (Reg. (EU) 2023/2772) + EFRAG IG3:** engine implements the IG3 quantitative-DP
  checklist with wave-specific phase-in relief per Directive (EU) 2022/2464 Art. 5.
- **EFRAG ESRS XBRL Taxonomy 2024 / ESAP (Reg. (EU) 2023/2869):** tagging module emits the
  taxonomy-referenced instance skeleton required for ESAP machine-readable filing.
- **IFRS S1/S2, TCFD, GRI 2021, SFDR RTS, TNFD v1.0:** interoperability is encoded as the 74-row
  DP equivalence table (e.g. Scope 1 = ESRS E1-6 §44(a) = S2-B36 = TCFD Metrics-a = GRI 305-1 =
  PAI-1), the same equivalences published in the ESRS–ISSB and GRI–ESRS interoperability indices.
- **ISAE 3000 (→ ISSA 5000):** assurance readiness is a weighted completeness/consistency proxy
  for limited-assurance evidence readiness, not an assurance opinion.

## 8 · Model Specification — Disclosure Coverage & Readiness Measurement

**Status: specification — not yet implemented in code** (the measurement layer exists in the
backend engine; what is missing is a *real* coverage model on the page, replacing `sr()`).

**8.1 Purpose & scope.** Give reporting teams a defensible, auditable coverage/readiness figure
per framework for the current reporting cycle, driving gap remediation and assurance planning.
Coverage: the 7 engine-supported frameworks across all consolidated entities.

**8.2 Conceptual approach.** Registry-based deterministic measurement — no stochastic modelling.
Mirrors **Workiva's ESG/CSRD readiness scoring** (requirement register × evidence status) and
**Datamaran/Position Green-style disclosure-gap analytics**: every required DP is a row in a
requirements register; coverage is a weighted ratio of evidenced DPs, gated by double materiality.

**8.3 Mathematical specification.**

```
For framework f with DP register D_f (from CROSS_FRAMEWORK_MAPPINGS + full EFRAG IG3 list):
  required(d) = mandatory(d) AND NOT phase_in_relief(d, wave) AND material(topic(d))   ← DMA gate
  evidence(d) ∈ {0 missing, 0.5 draft/estimated, 0.9 measured, 1.0 assured}
  Coverage_f  = Σ_{d ∈ required} w_d · evidence(d) / Σ_{d ∈ required} w_d     (w_d = IG3 topic_weight)
  Quality_f   = Σ w_d · q_d / Σ w_d, q_d ∈ [0,1] from data-quality tier (measured/estimated/proxy — PCAF-style 1–5 mapped to 1.0/0.8/0.6/0.4/0.2)
  Consistency = rules passed / rules applicable          (engine CR-001…CR-020, keep (max−min)/max stat)
  Readiness_f = 0.5·Coverage_f + 0.3·Quality_f + 0.2·Consistency
```

| Parameter | Value | Source |
|---|---|---|
| w_d | IG3 topic_weight 0.8–2.0 | EFRAG IG3 (already in engine) |
| Evidence ladder | 0/0.5/0.9/1.0 | ISAE 3000 evidence hierarchy; Workiva practice |
| Materiality gate | DMA output per ESRS 1 §3 | Platform `csrd-dma` module (exists) |
| Consistency tolerances | 5–50% per rule | Engine `CONSISTENCY_RULES`; Scope-1 5% per ESRS/SFDR reconciliation practice |
| Readiness weights 0.5/0.3/0.2 | Design choice | Calibrate against assurance-provider readiness reviews |

**8.4 Data requirements.** DP register (engine tables — present); per-DP evidence status and
data-quality tier (needs a `disclosure_datapoints` table keyed by dp_id × entity × year); DMA
topic materiality flags (from `csrd-dma`); engine outputs already routed via
`POST /compile` and `/readiness-score`. Vendor optional: EFRAG full IG3 XLSX (free) to extend the
62-row sample to all ≈330 quantitative DPs.

**8.5 Validation & benchmarking.** Reconcile Coverage_f against an external readiness assessment
(Big-4 CSRD gap analysis) on one pilot entity; unit-test the DMA gate (immaterial topics must not
count); re-run the 20 consistency rules on published FY2024 CSRD reports as a golden dataset;
stability test — coverage must be idempotent across recomputation (no PRNG).

**8.6 Limitations & model risk.** Presence-based evidence can overstate readiness if values are
wrong but present (mitigated by consistency rules and quality tiers); weights w_d encode EFRAG
emphasis, not entity-specific audit risk; readiness weights are judgemental — disclose them and
run ±0.1 sensitivity; fallback: report unweighted DP counts alongside the weighted score.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its real engine, then feed it real datapoints (analytics ladder: rung 1 → 3)

**What.** §7 documents the platform's starkest wiring gap: the backend engine (E119)
genuinely implements the guide — 74-row cross-framework DP mapping, 62-DP ESRS IG3
checklist, 50 EFRAG XBRL concepts, 20 consistency rules, readiness scoring — while the
React page fabricates every displayed number with `sr()` (coverage 30–90%, random
alignment at `sr > 0.4`, a fabricated audit trail) and never calls any of the 9
endpoints. Evolution A deletes the synthetic layer and connects the two, then deepens
the engine's checklist toward the full standard.

**How.** (1) Frontend rewiring: dashboard KPIs from `POST /compile`; the Datapoint
Mapper from `GET /ref/framework-mapping` (a real 74-row table exists — the page rolls
dice instead); consistency heatmap from `POST /consistency-check`'s 20 rules, ending
the §7.1 situation where two views of overlap use unrelated seeds. (2) Fix
`POST /readiness-score` (harness status `failed`) and add fixtures for the three
skipped POSTs. (3) Data feed: populate DP values from platform modules that already
compute them (Scope 1 from the PCAF/emissions engines feeding CR-001's cross-framework
agreement rule) rather than manual entry alone. (4) Checklist depth: extend the 62-DP
IG3 sample toward the ≈330 quantitative mandatory DPs its own docstring acknowledges,
versioned against EFRAG releases — the rung-3 benchmark discipline.

**Prerequisites (hard).** Full `sr()` purge from the page; the readiness-score fix;
DP-value sourcing map (which module owns each metric). **Acceptance:** every on-screen
number reproduces via a listed endpoint; the CR-001 Scope 1 consistency rule evaluates
real platform values; coverage changes only when underlying data changes.

### 9.2 Evolution B — Narrative-section drafter inside the report builder (LLM tier 2)

**What.** The engine produces structure (completeness, gaps, XBRL facts) but the
guide's "Report Builder generates narrative sections" needs prose — the classic LLM
slot. Evolution B drafts each ESRS narrative section from the compiled data: E1
transition-plan narrative referencing the quantitative DPs the engine has validated,
gap disclosures for phase-in relief items (the engine knows each DP's `phase_in`
year), and omission justifications gated by materiality flags. Each draft paragraph
carries inline DP references that the XBRL tagger can anchor.

**How.** Tool-calling over the module's own endpoints: the drafter first runs
`POST /esrs-report` to get the authoritative gap/readiness state, then writes
sections only for topics the data supports, quoting values verbatim from the compile
payload. The 20 consistency rules become pre-publication linting: a draft that quotes
Scope 1 inconsistently with the engine's CR-001 evaluation is rejected before human
review. Output renders through the report-studio layer; iXBRL assembly stays
deterministic code (`generate_xbrl_tagging`), never LLM-generated markup.

**Prerequisites (hard).** Evolution A — drafting narratives over the current
`sr()`-fabricated page state would automate fiction; DMA gating requires the
double-materiality assessment import the guide describes. **Acceptance:** every
numeric in a drafted section matches the compile payload; sections for immaterial
topics produce omission justifications, not content; the consistency linter blocks a
deliberately inconsistent test draft.