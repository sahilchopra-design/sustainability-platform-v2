# CSRD iXBRL Tagger
**Module ID:** `csrd-ixbrl` · **Route:** `/csrd-ixbrl` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Applies ESRS XBRL taxonomy tags to quantitative and qualitative CSRD disclosures, validates tags against EFRAG taxonomy schema, and generates machine-readable iXBRL files for submission to European Single Access Point (ESAP). Supports multi-language tagging for multinational reporters.

> **Business value:** Enables sustainability reporting and finance teams to produce ESAP-ready iXBRL digital CSRD reports, meeting the machine-readability requirements that allow regulators, investors, and data platforms to automatically extract and compare sustainability data.

**How an analyst works this module:**
- Import CSRD report draft (HTML or DOCX) into the tagging workspace
- Auto-Tagger tab runs semantic matching to suggest taxonomy elements for each data point
- Manual Review tab allows analyst to confirm, override, or extend suggested tags
- Validation Engine checks schema conformance and flags errors with EFRAG guidance links
- Multi-Language Config sets display labels for human-readable narrative sections
- Export iXBRL file and validation report for ESAP submission and external assurance review

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `BADGE`, `BASE_COVERAGE`, `ESRS_STANDARDS`, `FRAMEWORKS`, `FW_COLOR`, `MANUAL_FIELDS`, `MULTI_FW`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ESRS_STANDARDS` | 13 | `name`, `mapped`, `total` |
| `MULTI_FW` | 9 | `esrs`, `gri`, `issb`, `eu_tax`, `brsr` |
| `MANUAL_FIELDS` | 11 | `label`, `type`, `defaultValue` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `linkedCINs` | `useMemo(() => ctx.portfolioHoldings.filter(h => h.cin).map(h => ({ cin: h.cin, name: h.company_name })), [ctx.portfolioHoldings] );` |
| `factCount` | `Math.round(1111 * (filledCount / 5));` |
| `totalGHG` | `emissions.s1 + emissions.s2 + emissions.s3;` |
| `intensity` | `emissions.revenue > 0 ? (totalGHG / (emissions.revenue / 1e6)).toFixed(1) : '—';` |
| `coverageBarData` | `ESRS_STANDARDS.map(e => ({` |
| `allFWResults` | `compareAll ? FRAMEWORKS.map(fw => ({` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ESRS_STANDARDS`, `FRAMEWORKS`, `MANUAL_FIELDS`, `MULTI_FW`
**Shared context buses:** `TestDataContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Taxonomy Elements (ESRS Set 1) | — | EFRAG XBRL Taxonomy 2023 | Total number of XBRL elements in the ESRS taxonomy covering quantitative and qualitative disclosures |
| Mandatory Tag Coverage | — | ESRS XBRL Taxonomy | Regulatory expectation for coverage of mandatory quantitative data points with valid taxonomy tags |
| Validation Errors (target) | — | EFRAG/ESAP validator | Goal of zero schema validation errors before submission; warnings reviewed for materiality |
| Multi-Language Support | — | ESAP regulation | Languages supported for human-readable narrative labels in iXBRL file |
| iXBRL File Size | — | Technical estimate | Typical size of generated iXBRL sustainability report file for mid-to-large companies |
- **CSRD report draft (HTML/DOCX)** → Parse document structure, identify quantitative and qualitative disclosure sections → **Untagged disclosure element list**
- **EFRAG ESRS XBRL taxonomy database** → Semantic matching of disclosure elements to taxonomy IDs → **Suggested tag assignments per element**
- **EFRAG/ESAP validation schema** → Run conformance checks, generate error/warning report → **Validated iXBRL file for submission**

## 5 · Intermediate Transformation Logic
**Methodology:** ESRS XBRL Taxonomy Tagging
**Headline formula:** `Tag_coverage = Matched_datapoints / Total_quantitative_datapoints × 100%`

ESRS taxonomy elements are matched to disclosure data points using a three-layer matching process: (1) exact datapoint ID match, (2) semantic similarity matching for narrative elements, (3) extension taxonomy for non-standard items. Validation checks cover: tag-value consistency, mandatory extension metadata, period and unit annotations, and schema conformance. Invalid or unmapped tags generate actionable error messages with EFRAG guidance references.

**Standards:** ['EFRAG ESRS XBRL Taxonomy 2023', 'ESEF Regulation (EU) 2019/815', 'ESAP Regulation (EU) 2023/2859']
**Reference documents:** EFRAG ESRS XBRL Taxonomy 2023 (including extension guidance); EU ESEF Regulation (EU) 2019/815 â€” Inline XBRL Technical Standard; ESAP Regulation (EU) 2023/2859 â€” European Single Access Point; XBRL International â€” Inline XBRL Specification 1.1

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide describes an *ESRS XBRL Taxonomy Tagging* engine with `Tag_coverage = Matched_datapoints /
Total_quantitative_datapoints × 100%` and a three-layer semantic matching process. The code implements
the **coverage arithmetic and a real cross-framework mapping table** (ESRS↔GRI↔ISSB↔EU Taxonomy↔BRSR
per indicator), and a real emissions-intensity calculation — but the tag *matching* itself is not a
semantic engine; `mapped/total` counts per ESRS standard are hard-coded, and `factCount` is a linear
proxy of how many manual fields the user filled. Partial mismatch: the mapping and coverage display are
genuine; the "auto-tagger" is illustrative.

### 7.1 What the module computes

```js
factCount   = round(1111 · (filledCount / 5))                 // iXBRL facts ∝ manual fields filled
totalGHG    = emissions.s1 + emissions.s2 + emissions.s3
intensity   = revenue>0 ? (totalGHG / (revenue/1e6)).toFixed(1) : '—'   // tCO2e per $M revenue
coverageBar = ESRS_STANDARDS.map(e => ({..., pct: e.mapped/e.total·100}))
```
The cross-framework comparison (`compareAll`) maps each of ~8 core indicators to its ESRS DR, GRI
disclosure, IFRS S2 paragraph, EU Taxonomy annex and BRSR principle — a genuine, correct
interoperability crosswalk.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| ESRS_STANDARDS mapped/total | ESRS 1 78/82, ESRS 2 112/116, E1 185/198, S1 132/148, … | hard-coded demo (plausible tag counts) |
| BASE_COVERAGE | ESRS 89 / GRI 74 / ISSB 68 / EU_TAX 61 / BRSR 55 | hard-coded demo |
| MULTI_FW crosswalk | GHG S1 → ESRS E1-6 / GRI 305-1 / IFRS S2-22a / Annex I / P6 C1 | **real** — standards interoperability |
| Fact count | `round(1111·(filled/5))` | proxy (1111 = full-report fact target) |
| Intensity | `totalGHG / (revenue/1e6)` tCO₂e/$M | **real** — standard GHG intensity |
| MANUAL_FIELDS | company/year/framework + S1/S2/S3/energy/water/revenue | curated input schema |

The interoperability crosswalk is the module's real asset — the tag-count numbers are illustrative
targets, not the output of a matching algorithm.

### 7.3 Calculation walkthrough

User fills MANUAL_FIELDS (or pulls linked CINs from `TestDataContext`) → `filledCount` drives
`factCount` (a linear proxy) and `totalGHG`/`intensity` (real arithmetic on entered scopes). The
coverage bar renders `mapped/total` per ESRS standard from static counts. The multi-framework tab shows
the crosswalk; `compareAll` computes per-framework coverage from `BASE_COVERAGE`. A `POST` can generate
the iXBRL output server-side.

### 7.4 Worked example (intensity + fact count)

User enters S1 = 20,000, S2 = 15,000, S3 = 200,000 tCO₂e, revenue = $5,000M, and fills 4 of 5 fields:
```
totalGHG  = 20000 + 15000 + 200000 = 235,000 tCO2e
intensity = 235000 / (5000e6/1e6) = 235000/5000 = 47.0 tCO2e/$M revenue
factCount = round(1111·(4/5)) = round(888.8) = 889 iXBRL facts
```
The GHG intensity is a correct, standard metric; `factCount` is a plausible-looking proxy, not an
actual count of generated XBRL facts.

### 7.5 Data provenance & limitations

- **Cross-framework crosswalk (ESRS/GRI/ISSB/EU Taxonomy/BRSR) is real and correct** — genuinely useful.
- **Tag counts (`mapped/total`, `BASE_COVERAGE`) are hard-coded demo values**; `factCount` is a linear
  proxy, not a tagging-engine output.
- No actual semantic matching, schema validation, or iXBRL generation happens client-side; those are
  described but delegated to a backend generate call.

**Framework alignment:** EFRAG ESRS XBRL Taxonomy 2023 (tagging target) · ESEF Reg (EU) 2019/815 (iXBRL
format) · ESAP Reg (EU) 2023/2859 (submission portal) · cross-mapped to GRI, IFRS S2 (ISSB), EU
Taxonomy annexes, and India BRSR. The interoperability layer is faithful; the auto-tagger and coverage
counts are illustrative.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Tag matching and fact counting are proxies; no
real taxonomy-matching or iXBRL validation engine exists client-side.

**8.1 Purpose & scope.** Auto-tag CSRD narrative + quantitative disclosures to the ESRS XBRL taxonomy,
validate against the EFRAG schema, and emit an ESAP-ready iXBRL file with a measured coverage score.

**8.2 Conceptual approach.** A **three-layer matcher** (exact datapoint-ID → embedding-based semantic
similarity → extension taxonomy) plus **XBRL schema validation**, the approach used by Workiva and
Parseport iXBRL tools. Coverage is measured, not assumed.

**8.3 Mathematical specification.**
```
Match(dp) = { exact if dp_id ∈ taxonomy;
              semantic if cos(embed(dp_text), embed(element)) > τ;
              extension otherwise }
TagCoverage = |{dp : Match(dp) ∈ {exact, semantic}}| / |quantitative dp|
ValidationErrors = schema-conformance failures (period/unit/context/mandatory-metadata)
FactCount = |tagged facts emitted|                                   # actual count, not proxy
```

| Parameter | Source |
|---|---|
| ESRS taxonomy elements | EFRAG ESRS XBRL Taxonomy 2023 |
| Embeddings / τ | sentence-transformer + tuned threshold |
| Schema rules | ESEF Reg / XBRL Inline 1.1 |
| Crosswalk (real) | module's MULTI_FW table |

**8.4 Data requirements.** ESRS taxonomy schema; disclosure text + quantitative datapoints with units/
periods; extension-taxonomy registry. Sources: EFRAG taxonomy, csrd-esrs modules for datapoints. The
crosswalk and input schema already exist.

**8.5 Validation & benchmarking.** Validate emitted iXBRL against the EFRAG/ESAP validator (target 0
schema errors); benchmark tag coverage vs commercial taggers on a shared report; spot-check semantic
matches against analyst tagging.

**8.6 Limitations & model risk.** Semantic matching mis-tags narrative disclosures; extension taxonomy
needs governance to avoid non-comparability. Fallback: route sub-threshold matches to mandatory human
review (the guide's "Manual Review" tab) before emission.

## 9 · Future Evolution

### 9.1 Evolution A — A real tagging engine behind the real crosswalk (analytics ladder: rung 1 → 2)

**What.** §7's partial-mismatch: the module's cross-framework crosswalk
(ESRS↔GRI↔IFRS S2↔EU Taxonomy↔BRSR per indicator) is "real and correct — genuinely
useful", and the GHG-intensity arithmetic is sound; but the tagging itself is
illustrative — `mapped/total` counts are hard-coded, `factCount` is the linear proxy
`1111 × filled/5`, and no semantic matching, schema validation, or iXBRL generation
happens client-side. The platform already has the missing half:
`comprehensive_reporting_engine.generate_xbrl_tagging` maps DP ids to 50 EFRAG
`ESRS-XBRL-2024` concepts and emits an XBRL 2.1 instance structure. Evolution A
connects and extends.

**How.** (1) Wire the tagger to the comprehensive-reporting engine's
`POST /xbrl-tag` so coverage counts and fact lists are engine outputs, not
constants; untagged datapoints surface as the engine's validation warnings.
(2) Extend the concept table from the 50-concept sample toward the full EFRAG ESRS
XBRL taxonomy (published, versioned) — coverage percentages then mean something.
(3) iXBRL assembly: server-side generation of the Inline XBRL 1.1 document from
tagged facts (deterministic templating — the ESEF toolchain patterns are public),
with schema validation against the taxonomy and actionable errors per the guide's
description. (4) Keep the crosswalk as the multi-framework view and the intensity
calc as-is; both are already honest.

**Prerequisites.** EFRAG taxonomy ingestion (public download, versioned in
refdata); coordination with `comprehensive-reporting` (its engine is the tagging
source of truth; this module is the workbench UI). **Acceptance:** `factCount`
equals the engine's emitted fact list length; an intentionally malformed fact fails
schema validation with a cited rule; coverage recomputes when the taxonomy version
changes.

### 9.2 Evolution B — Semantic tag-suggestion reviewer (LLM tier 2)

**What.** The guide's "three-layer matching" names the layer only an LLM supplies
well: semantic matching of *narrative* disclosures to taxonomy elements, where
exact datapoint-ID matches fail. Evolution B implements the auto-tagger the UI
already sketches: report passages get proposed taxonomy elements with confidence
and rationale ("this paragraph describes transition-plan resourcing → E1-1
concept X"), the analyst confirms or overrides in the existing Manual Review tab,
and confirmed pairs accumulate into a platform-owned matching memory that improves
suggestions — the roadmap's data-flywheel pattern in miniature.

**How.** Tier-2 with gated writes: suggestion prompts ground on the taxonomy
element definitions and the ESRS paragraph citations from the reference layer;
output is constrained to valid element IDs (no invented concepts — the schema is
the guardrail). Low-confidence suggestions queue rather than auto-apply; the
deterministic engine handles exact-ID matches first so the LLM only sees the
residual. Confirmed mappings log to `llm_traces` per the roadmap's Tier-4
data-collection design.

**Prerequisites (hard).** Evolution A's engine wiring and taxonomy table (semantic
suggestions against 50 sample concepts would be a toy); document import path for
report drafts. **Acceptance:** on a public CSRD report excerpt, ≥80% of suggestions
for quantitative facts confirmed unchanged; every suggestion names a real taxonomy
element; unmatched passages are reported unmatched rather than force-tagged.