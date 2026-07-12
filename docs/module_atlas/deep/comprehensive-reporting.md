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
