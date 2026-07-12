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
