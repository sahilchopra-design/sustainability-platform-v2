# Client Sustainability Report Generator
**Module ID:** `client-report` · **Route:** `/client-report` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automated sustainability report generation engine producing TCFD-aligned, SFDR-compliant, and CSRD-ready client reports. Combines portfolio analytics, narrative generation, chart exports, and regulatory appendices into formatted PDF-ready output packages.

> **Business value:** Report completeness threshold: 80% data coverage triggers auto-generate. SFDR PAI table auto-populates 18 mandatory indicators from portfolio data. CSRD ESRS coverage tracks E1 through G1 disclosure requirements.

**How an analyst works this module:**
- Select report type: TCFD, SFDR, CSRD, or GRI
- Template Configurator sets section inclusions and custom narrative
- Data Binding tab shows coverage and flags data gaps
- Preview renders report sections before finalisation
- Export generates PDF-ready package with regulatory appendices

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALIGN_SCORE`, `ALL_SECTIONS`, `BADGE`, `COMPLIANCE`, `EXEC_SUMMARY`, `FRAMEWORKS`, `HOLDINGS`, `PIE_COLORS`, `PORTFOLIOS`, `SECTOR_PIE`, `TRISK_BAR`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `HOLDINGS` | 6 | `weight`, `sector`, `scope1`, `trisk`, `dqs`, `sbti` |
| `SECTOR_PIE` | 6 | `value` |
| `TRISK_BAR` | 4 | `count` |
| `COMPLIANCE` | 5 | `status`, `icon`, `color` |
| `ALL_SECTIONS` | 11 | `label`, `default` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_SECTIONS`, `COMPLIANCE`, `FRAMEWORKS`, `HOLDINGS`, `PIE_COLORS`, `PORTFOLIOS`, `SECTOR_PIE`, `TRISK_BAR`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Report Completeness Score | `Filled sections / total sections` | Platform | Percentage of report sections with sufficient data for auto-population |
| SFDR PAI Coverage | `Populated PAI indicators / 18 mandatory` | SFDR Annex I | Fraction of mandatory SFDR PAI indicators with data for auto-fill |
| CSRD ESRS Coverage | `Disclosed DRs / required DRs` | CSRD ESRS | Fraction of required ESRS disclosure requirements addressed in report |
| Report Generation Time | `Template render + data bind` | System metric | End-to-end time to generate complete report package |
- **Portfolio analytics engine** → Live data → data binding layer → report sections → **Auto-populated report content**
- **Regulatory template library** → SFDR/CSRD/TCFD templates → formatted output → **Compliance-ready report package**

## 5 · Intermediate Transformation Logic
**Methodology:** Templated report assembly with data binding
**Headline formula:** `Report = Template(Section_i → DataBinding_i) ∀ i; Completeness = Σ(FilledSections) / TotalSections`

Report sections bound to live portfolio analytics via data binding layer. Narrative paragraphs generated from structured data using regulatory-aligned templates. Chart exports use portfolio visualisation API. Completeness score tracks data coverage; sections with <80% data completeness flagged for manual review. Regulatory appendix auto-populates SFDR PAI table and TCFD disclosure matrix.

**Standards:** ['TCFD Recommendations 2017', 'SFDR Level 2 RTS Annex I', 'CSRD ESRS E1/S1/G1', 'GRI Universal Standards 2021']
**Reference documents:** TCFD Final Recommendations and Implementation Guidance 2017; SFDR Level 2 RTS Annex I PAI Template; CSRD ESRS Set 1 (E1–S4–G1); GRI Universal Standards 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an *automated report-generation
> engine* with a live "data binding layer", a `Completeness = Σ(FilledSections)/TotalSections` score,
> "SFDR PAI table auto-populates 18 mandatory indicators from portfolio data", "CSRD ESRS coverage",
> narrative "generated from structured data", and an <80%-completeness flag. **Almost none of that
> computation exists.** The code is a **static report-preview studio**: it lets a user toggle report
> sections on/off, pick a framework, and renders a fixed template filled with **hard-coded demo
> numbers** (WACI 285, implied temp 2.8 °C, Scope 1/2/3 = 45.2 / 3.1 / 180 Mt) and five pre-written
> narrative paragraphs. There is no data binding, no PAI auto-population, no completeness gate, and
> no coverage arithmetic. The sections below document what the page actually does.

### 7.1 What the module computes

The page holds five configuration state values (`clientName`, `reportDate`, `framework`,
`portfolio`, `sections`) and renders a preview. The only "computations" are trivial counters:

```
selectedCount = count(sections where value == true)             // of 10
align         = ALIGN_SCORE[framework]                           // lookup, not computed
Est. Pages    = selectedCount + 2
Est. Words    = selectedCount × 320 + 580
```

`ALIGN_SCORE` is a **static lookup table** (TCFD 62, SFDR PAI 54, UNPRI 71, CSRD 58, Custom 65) —
the "Climate Alignment Score" is not derived from any portfolio; switching frameworks swaps a
constant.

### 7.2 Parameterisation / seed data

| Constant | Value | Provenance |
|---|---|---|
| `HOLDINGS` (5 rows) | Reliance/NTPC/TCS/HDFC/Coal India with `weight`,`scope1`,`trisk`,`dqs`,`sbti` | Hard-coded demo portfolio |
| `SECTOR_PIE` | 5 sector weights | Hard-coded (note: sums to 99.9 %, not tied to HOLDINGS weights) |
| `TRISK_BAR` | High 3 / Med 1 / Low 2 | Hard-coded counts |
| GHG figures | S1 45.2, S2 3.1, S3 180 Mt; WACI 285; temp 2.8 °C | **Hard-coded literals in JSX and in `handleExportJSON`** |
| `ALIGN_SCORE` | per-framework 54–71 | Hard-coded |
| `EXEC_SUMMARY` | 5 prose paragraphs per framework | Hand-written narrative strings |

The narrative strings embed the same numbers as prose (e.g. "WACI of 285 tCO₂e/$M revenue exceeds
the global benchmark of 180", "implied portfolio temperature of 2.8 °C") — they are illustrative
copy, not generated from data.

### 7.3 Calculation walkthrough

1. User edits `clientName` / `reportDate` / `framework` / `portfolio` and toggles section checkboxes.
2. `handleGenerate` simply sets `generated = true` (no computation).
3. The center pane conditionally renders each enabled section from the constants above.
4. `EXEC_SUMMARY[framework]` is split on `\n\n` and rendered as paragraphs; `align` badge shows the
   looked-up score.
5. Export: `handleExportJSON` serialises the config plus the hard-coded `ghg` object to a JSON blob;
   `handleCopy` copies a one-line summary string. PDF/Email buttons are disabled ("requires premium").

### 7.4 Worked example — metadata for a 7-section TCFD report

Select framework **TCFD** and enable 7 of 10 sections:

| Step | Computation | Result |
|---|---|---|
| Alignment badge | `ALIGN_SCORE.TCFD` | 62/100 — "Moderate" |
| Est. Pages | 7 + 2 | **9** |
| Est. Words | 7 × 320 + 580 | **2,820** |
| WACI shown | literal | 285 tCO₂e/$M (constant regardless of `portfolio`) |
| Implied temp | literal | 2.8 °C (constant) |

Changing the `portfolio` dropdown does **not** change any number — the same demo holdings and GHG
figures render for all four portfolios.

### 7.5 Data provenance & limitations

- **No seeded PRNG** here — but no live data either. Every metric is a hard-coded constant; the
  "report" is a formatting shell.
- The guide's completeness score, PAI auto-population, ESRS coverage, and data-binding layer are
  **absent**. `selectedCount`/`ALL_SECTIONS.length` is the closest analogue to a completeness ratio
  but it is only used for the page/word estimate, never as an <80% quality gate.
- `SECTOR_PIE` weights are not reconciled to `HOLDINGS` weights; the two demo tables are independent.
- PDF and email export are stubbed out.

**Framework alignment:** The page *names* TCFD (4 pillars), SFDR PAI (Level 2 RTS), UNPRI, CSRD/ESRS
(double materiality, ESRS E1-6), and EU Taxonomy in its narrative — but implements none of them
computationally. A reader should treat this module as a **presentation template**, not an analytics
engine; the real disclosure computations live in the dedicated CSRD/SFDR/TCFD modules.

## 8 · Model Specification — Report Data-Binding & Completeness Engine

**Status: specification — not yet implemented in code.** The guide promises a data-bound report
generator with a completeness gate and auto-populated regulatory tables; this specifies it.

### 8.1 Purpose & scope
Assemble a client ESG/climate report by binding live portfolio analytics to a section template,
auto-populating the SFDR PAI table and CSRD ESRS disclosure matrix, and gating auto-generation on a
data-completeness threshold.

### 8.2 Conceptual approach
A **template-plus-binding** document model (analogous to XBRL-tagged disclosure generators and
Workiva-style bound reporting): each section declares required data fields; a binding resolver pulls
them from the platform's portfolio engines; a completeness score decides auto-generate vs
manual-review. Benchmarks: SFDR Annex I PAI template (Level 2 RTS) and EFRAG ESRS Set 1 datapoint
taxonomy.

### 8.3 Mathematical specification
```
For section s with required fields F_s:
  filled_s        = count( f ∈ F_s : value(f) ≠ null ) / |F_s|
Completeness      = Σ_s (w_s · filled_s) / Σ_s w_s          (w_s = section weight)
PAI_coverage      = populated PAI indicators / 18
ESRS_coverage     = disclosed DRs / required DRs (per materiality)
AutoGenerate      = Completeness ≥ 0.80
```
| Parameter | Source |
|---|---|
| PAI indicators (18) | SFDR Level 2 RTS Annex I (14 mandatory + ≥2 opt-in) |
| ESRS datapoints | EFRAG ESRS Set 1 XBRL taxonomy |
| Section field maps | Platform config |
| Portfolio metrics (WACI, FE, ITR) | `pcaf-financed-emissions`, `sfdr-pai`, `portfolio-temperature-score` engines |

### 8.4 Data requirements
A resolvable portfolio id; per-holding EVIC, revenue, Scope 1/2/3, DQ, ITR (from existing engines);
the SFDR PAI schema and ESRS datapoint list. All portfolio metrics already exist in sibling modules;
this engine only needs a binding layer, not new maths.

### 8.5 Validation & benchmarking plan
Unit-test each field binding against its source engine; reconcile the auto-populated PAI table
against the `sfdr-pai` module output for the same portfolio; verify completeness gate triggers
manual review below 0.80; validate ESRS coverage against a known-material topic set.

### 8.6 Limitations & model risk
Binding staleness (source engine updated after render); PAI "populated but low-DQ" should not count
as fully filled; narrative generation from data risks over-claiming — keep generated prose
templated and flag any unbound figure rather than defaulting to a demo constant.

## 9 · Future Evolution

### 9.1 Evolution A — Real data binding with a computed completeness gate (analytics ladder: rung 1 → 2)

**What.** §7 is unambiguous: the guide sells an automated report engine (data-binding
layer, `Completeness = FilledSections/Total`, SFDR PAI auto-population of 18
indicators, <80% flags) but the code is a static preview studio rendering hard-coded
demo numbers (WACI 285, ITR 2.8°C, Scope 1/2/3 = 45.2/3.1/180 Mt) into toggleable
sections with five pre-written paragraphs. Evolution A builds the binding layer for
real: report sections declare their required data fields; a resolver pulls them from
the platform's portfolio-analytics endpoints for a selected `portfolios_pg` portfolio;
per-section completeness is computed from actually-resolved fields; and sections below
the 80% threshold render with an explicit data-gap panel instead of demo numbers.

**How.** (1) A binding manifest per section (e.g. TCFD Metrics section requires WACI,
scope totals, ITR; SFDR appendix requires the PAI indicator set) — the completeness
formula becomes real arithmetic over resolved vs required fields. (2) PAI table
populated from portfolio data where the platform computes those indicators, with
unpopulated indicators shown as honest gaps, never defaults — partial PAI coverage is
the true state and must be visible. (3) The hard-coded demo numbers survive only in an
explicitly-labelled "sample report" mode.

**Prerequisites.** Portfolio-analytics endpoint health (post the 2026-07-05 500-fix
sweep); a mapping audit of which PAI indicators the platform genuinely computes today
— the number is less than 18 and the module must say so. **Acceptance:** selecting a
real portfolio produces a report whose every figure matches its source endpoint;
completeness reflects removed data (unbind a field, watch the score drop); the
mismatch flag clears.

### 9.2 Evolution B — Grounded narrative generation (LLM tier 2)

**What.** Replace the five pre-written paragraphs with LLM-drafted, regulator-safe
narrative generated strictly from the bound data: "portfolio WACI of X is Y% above
benchmark, driven by the utilities allocation" — where X and Y come from the binding
layer, and the prose templates follow TCFD/SFDR/CSRD framing per the report type. This
is the roadmap's designated render-layer role for report modules, and the highest-
stakes no-fabrication surface on the platform: regulatory filings must contain zero
invented numbers.

**How.** Per-section generation with the section's bound fields as the only numeric
context; the post-response validator rejects any draft containing numerics absent from
the binding payload (hard fail, not a log line); framework-language templates from the
§5 standards corpus (SFDR RTS Annex I, ESRS Set 1, TCFD 2017); human review-and-edit
before export, with an audit trail of draft versions.

**Prerequisites (hard).** Evolution A is strictly first — narrative generation over
hard-coded demo numbers would automate the production of fictional regulatory
documents. **Acceptance:** 100% of numerics in generated narrative appear in the
binding payload (validator-enforced); a section with failed bindings generates a data-
gap disclosure, not prose that papers over it.